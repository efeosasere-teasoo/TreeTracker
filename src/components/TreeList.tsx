import { useState, useEffect, type FormEvent } from 'react';
import { supabase, Plot, Tree, Species } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  TreePine, 
  Calendar, 
  Loader2,
  Trash2,
  Filter,
  X,
  MapPin,
  Info,
  Edit2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TreeList() {
  const [trees, setTrees] = useState<(Tree & { plots: Plot })[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlot, setFilterPlot] = useState<string>('all');
  const [editingTree, setEditingTree] = useState<Tree | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    plot_id: '',
    tree_type: '',
    planting_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [
        { data: treeData }, 
        { data: plotData },
        { data: speciesData }
      ] = await Promise.all([
        supabase
          .from('trees')
          .select('*, plots(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('plots')
          .select('*'),
        supabase
          .from('species')
          .select('*').order('common_name')
      ]);
      
      setTrees(treeData || []);
      setPlots(plotData || []);
      setSpecies(speciesData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (tree: Tree) => {
    setEditingTree(tree);
    setFormData({
      plot_id: tree.plot_id,
      tree_type: tree.tree_type,
      planting_date: tree.planting_date
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingTree(null);
    setFormData({
      plot_id: '',
      tree_type: '',
      planting_date: new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Submitting tree form:', formData);
    setSubmitting(true);
    try {
      if (editingTree) {
        const { error } = await supabase
          .from('trees')
          .update(formData)
          .eq('tree_id', editingTree.tree_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trees')
          .insert([formData]);
        if (error) throw error;
      }
      
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      alert('Error saving record: ' + (error.message || 'Check your connection.'));
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tree record?')) return;
    try {
      await supabase.from('trees').delete().eq('tree_id', id);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredTrees = trees.filter(t => {
    const matchesSearch = t.tree_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlot = filterPlot === 'all' || t.plot_id === filterPlot;
    return matchesSearch && matchesPlot;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input
              type="text"
              placeholder="Search tree types..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
            <select
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-lg appearance-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all text-sm font-medium text-stone-600"
              value={filterPlot}
              onChange={(e) => setFilterPlot(e.target.value)}
            >
              <option value="all">All Sectors</option>
              {plots.map(p => (
                <option key={p.plot_id} value={p.plot_id}>{p.sector_name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg"
        >
          <Plus size={18} />
          Record Planting
        </button>
      </div>

      {loading && trees.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-theme-sm">
          <div className="px-6 py-4 border-b border-stone-100 bg-white">
            <h2 className="font-bold text-stone-700">Asset Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-100 text-stone-400 text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-4">Tree Asset ID</th>
                  <th className="px-6 py-4">Species</th>
                  <th className="px-6 py-4">Sector / Block</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                <AnimatePresence>
                  {filteredTrees.map((tree) => (
                    <motion.tr
                      key={tree.tree_id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-stone-50 transition-colors text-sm"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-stone-400">
                        {tree.tree_id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-800">{tree.tree_type}</div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">Status: Healthy</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-stone-500">
                          <MapPin size={14} className="text-stone-300" />
                          <span className="font-medium">{tree.plots?.sector_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(tree)}
                            className="p-2 text-stone-200 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(tree.tree_id)}
                            className="p-2 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {filteredTrees.length === 0 && !loading && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
                <TreePine size={32} />
              </div>
              <p className="text-stone-400 font-medium text-sm">No asset records found in this view.</p>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Form */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-stone-50 z-[70] shadow-2xl flex flex-col border-l border-stone-200"
            >
              <div className="h-16 px-8 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
                <h3 className="font-bold text-stone-800 tracking-tight uppercase text-sm">
                  {editingTree ? 'Update Asset Record' : 'New Tree Record'}
                </h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 flex-1 overflow-auto space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Target Sector</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-emerald-600 rounded-lg transition-all outline-none text-sm font-medium"
                    value={formData.plot_id}
                    onChange={(e) => setFormData({ ...formData, plot_id: e.target.value })}
                  >
                    <option value="">Select location...</option>
                    {plots.map(p => (
                      <option key={p.plot_id} value={p.plot_id}>{p.sector_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Species / Tree Type</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-emerald-600 rounded-lg transition-all outline-none text-sm font-medium appearance-none"
                      value={formData.tree_type}
                      onChange={(e) => setFormData({ ...formData, tree_type: e.target.value })}
                    >
                      <option value="">Select species...</option>
                      {species.map(s => (
                        <option key={s.species_id} value={s.common_name}>{s.common_name} ({s.scientific_name})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                  </div>
                  {species.length === 0 && (
                    <p className="text-[10px] text-amber-600 font-bold mt-1">Catalog is empty. Please add species first.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Verified Planting Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-stone-200 focus:border-emerald-600 rounded-lg transition-all outline-none text-sm font-medium"
                    value={formData.planting_date}
                    onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                  />
                </div>

                <div className="p-6 bg-stone-100 border border-stone-200 rounded-xl flex gap-4 text-stone-500">
                  <Info className="shrink-0 text-emerald-600" size={20} />
                  <p className="text-xs leading-relaxed font-medium">
                    {editingTree 
                      ? 'Saving changes will update the historical record for this specific asset ID.' 
                      : 'This record will be added to the project boundary. Asset ID will be automatically generated upon sync.'
                    }
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !formData.plot_id}
                  className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold text-sm tracking-widest uppercase shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Processing...' : (editingTree ? 'Update Record' : 'Confirm Record')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
