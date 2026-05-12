import { useState, useEffect, type FormEvent } from 'react';
import { supabase, Plot, Tree, Species } from '../lib/supabase';
import { offlineManager } from '../lib/offline';
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
  ChevronDown,
  WifiOff,
  CloudLightning,
  CheckCircle2
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
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSyncIds, setPendingSyncIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updatePendingIds = async () => {
      const ids = await offlineManager.getPendingIds('trees');
      setPendingSyncIds(ids);
    };
    updatePendingIds();
    const interval = setInterval(updatePendingIds, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    plot_id: '',
    tree_type: '',
    planting_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      // 1. Load from cache
      const [cachedTrees, cachedPlots, cachedSpecies] = await Promise.all([
        offlineManager.getCachedData('trees'),
        offlineManager.getCachedData('plots'),
        offlineManager.getCachedData('species')
      ]);

      if (cachedTrees) setTrees(cachedTrees);
      if (cachedPlots) setPlots(cachedPlots);
      if (cachedSpecies) setSpecies(cachedSpecies);
      
      if (cachedTrees || cachedPlots || cachedSpecies) {
        setLoading(false);
      }

      // 2. Fetch from network
      if (navigator.onLine) {
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
        
        if (treeData) {
          setTrees(treeData);
          await offlineManager.cacheData('trees', treeData);
        }
        if (plotData) {
          setPlots(plotData);
          await offlineManager.cacheData('plots', plotData);
        }
        if (speciesData) {
          setSpecies(speciesData);
          await offlineManager.cacheData('species', speciesData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
    setSubmitting(true);
    try {
      const treeRecord = {
        ...formData,
        tree_id: editingTree ? editingTree.tree_id : crypto.randomUUID()
      };

      // Optimistic Update
      let updatedTrees;
      if (editingTree) {
        updatedTrees = trees.map(t => t.tree_id === editingTree.tree_id ? { ...t, ...treeRecord } : t);
      } else {
        const plot = plots.find(p => p.plot_id === formData.plot_id);
        updatedTrees = [{ ...treeRecord, plots: plot as Plot } as any, ...trees];
      }
      
      setTrees(updatedTrees);
      await offlineManager.cacheData('trees', updatedTrees);

      // Enqueue
      await offlineManager.enqueue('trees', editingTree ? 'UPDATE' : 'INSERT', treeRecord);
      
      setShowForm(false);
      if (navigator.onLine) {
        setTimeout(fetchData, 500);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Local storage failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tree record?')) return;
    try {
      // Optimistic Delete
      const updatedTrees = trees.filter(t => t.tree_id !== id);
      setTrees(updatedTrees);
      await offlineManager.cacheData('trees', updatedTrees);

      // Enqueue Delete
      await offlineManager.enqueue('trees', 'DELETE', id);
      
      if (navigator.onLine) {
        setTimeout(fetchData, 500);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredTrees = trees.filter(t => {
    const matchesSearch = t.tree_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlot = filterPlot === 'all' || t.plot_id === filterPlot;
    return matchesSearch && matchesPlot;
  });

  return (
    <div className="space-y-6">
      {isOffline && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-900 text-xs font-bold uppercase tracking-wider"
        >
          <WifiOff size={16} />
          <span>Offline Mode: Sync pending for tree asset records.</span>
        </motion.div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
            <input
              type="text"
              placeholder="Search tree types..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all text-sm text-stone-900 placeholder:text-stone-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <select
              className="w-full pl-10 pr-4 py-3 bg-white border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all text-sm font-bold text-stone-700"
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
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-theme-sm">
            <div className="px-6 py-4 border-b border-stone-100 bg-white">
              <h2 className="font-bold text-stone-700">Asset Inventory</h2>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Tree Asset ID</th>
                    <th className="px-6 py-4">Species</th>
                    <th className="px-6 py-4">Sector / Block</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-900">
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
                        <td className="px-6 py-4 font-mono text-xs text-stone-600 font-bold">
                          {tree.tree_id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="font-bold">{tree.tree_type}</div>
                             {pendingSyncIds.has(tree.tree_id) ? (
                               <div className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100 font-black uppercase flex items-center gap-1">
                                 <CloudLightning size={8} />
                                 Pending
                               </div>
                             ) : (
                               <div className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100 font-black uppercase flex items-center gap-1">
                                 <CheckCircle2 size={8} />
                                 Synced
                               </div>
                             )}
                          </div>
                          <div className="text-[10px] text-stone-600 font-black uppercase tracking-tight">Status: Healthy</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-stone-700">
                            <MapPin size={14} className="text-stone-400" />
                            <span className="font-bold">{tree.plots?.sector_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(tree)}
                              className="p-2 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                              aria-label={`Edit ${tree.tree_type}`}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(tree.tree_id)}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                              aria-label={`Delete ${tree.tree_type}`}
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-stone-200">
              <AnimatePresence>
                {filteredTrees.map((tree) => (
                  <motion.div
                    key={tree.tree_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-stone-900">{tree.tree_type}</div>
                          {pendingSyncIds.has(tree.tree_id) ? (
                             <div className="text-[8px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-100 font-black animate-pulse uppercase">
                               <CloudLightning size={8} />
                             </div>
                          ) : (
                             <div className="text-[8px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100 font-black uppercase">
                               <CheckCircle2 size={8} />
                             </div>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-stone-600 font-bold uppercase">#{tree.tree_id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(tree)}
                          className="p-2.5 text-stone-600 active:bg-emerald-50 active:text-emerald-700 rounded-xl border border-stone-200"
                          aria-label={`Edit ${tree.tree_type}`}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tree.tree_id)}
                          className="p-2.5 text-stone-600 active:bg-red-50 active:text-red-600 rounded-xl border border-stone-200"
                          aria-label={`Delete ${tree.tree_type}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-stone-700 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
                        <MapPin size={12} className="text-stone-500" />
                        {tree.plots?.sector_name || 'Unassigned'}
                      </div>
                      <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                        Healthy
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {filteredTrees.length === 0 && !loading && (
              <div className="py-20 text-center space-y-4 px-6">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
                  <TreePine size={32} />
                </div>
                <p className="text-stone-400 font-medium text-sm">No asset records found in this view.</p>
              </div>
            )}
          </div>
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
                  <label className="text-[10px] font-black text-stone-700 uppercase tracking-widest pl-1">Target Sector</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-bold text-stone-900"
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
                  <label className="text-[10px] font-black text-stone-700 uppercase tracking-widest pl-1">Species / Tree Type</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-bold text-stone-900 appearance-none"
                      value={formData.tree_type}
                      onChange={(e) => setFormData({ ...formData, tree_type: e.target.value })}
                    >
                      <option value="">Select species...</option>
                      {species.map(s => (
                        <option key={s.species_id} value={s.common_name}>{s.common_name} ({s.scientific_name})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 pointer-events-none" />
                  </div>
                  {species.length === 0 && (
                    <p className="text-[10px] text-amber-800 font-bold mt-1">Catalog is empty. Please add species first.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-700 uppercase tracking-widest pl-1">Verified Planting Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-bold text-stone-900"
                    value={formData.planting_date}
                    onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                  />
                </div>

                <div className="p-6 bg-stone-100 border border-stone-300 rounded-xl flex gap-4 text-stone-700">
                  <Info className="shrink-0 text-emerald-800" size={20} />
                  <p className="text-xs leading-relaxed font-bold">
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
