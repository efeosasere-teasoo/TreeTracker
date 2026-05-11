import { useState, useEffect, type FormEvent } from 'react';
import { supabase, Species } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Leaf, 
  Loader2,
  Trash2,
  X,
  Edit2,
  Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SpeciesCatalog() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSpecies, setEditingSpecies] = useState<Species | null>(null);

  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: ''
  });

  const fetchSpecies = async () => {
    try {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('common_name', { ascending: true });
      
      if (error) throw error;
      setSpecies(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, []);

  const handleAddNew = () => {
    setEditingSpecies(null);
    setFormData({ common_name: '', scientific_name: '' });
    setShowForm(true);
  };

  const handleEdit = (item: Species) => {
    setEditingSpecies(item);
    setFormData({ 
      common_name: item.common_name, 
      scientific_name: item.scientific_name 
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSpecies) {
        const { error } = await supabase
          .from('species')
          .update(formData)
          .eq('species_id', editingSpecies.species_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('species')
          .insert([formData]);
        if (error) throw error;
      }
      
      setShowForm(false);
      fetchSpecies();
    } catch (error: any) {
      alert('Error saving species: ' + (error.message || 'Check connection'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will not delete trees already planted but will remove it from the catalog.')) return;
    try {
      await supabase.from('species').delete().eq('species_id', id);
      fetchSpecies();
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = species.filter(s => 
    s.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.scientific_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
          <input
            type="text"
            placeholder="Search catalog..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all shadow-lg"
        >
          <Plus size={18} />
          New Species
        </button>
      </div>

      {loading && species.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence>
            {filtered.map((item) => (
              <motion.div
                key={item.species_id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200 shadow-theme-sm group relative active:bg-stone-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3 md:mb-2">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
                    <Leaf size={20} />
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-2 text-stone-400 hover:text-emerald-600 active:bg-emerald-100 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.species_id)} className="p-2 text-stone-400 hover:text-red-500 active:bg-red-100 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-stone-800 text-base md:text-lg leading-tight">{item.common_name}</h3>
                <div className="flex items-center gap-2 text-stone-400 mt-2 md:mt-1 italic text-xs md:text-sm">
                  <Dna size={12} className="shrink-0" />
                  {item.scientific_name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Side Form */}
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
              className="fixed top-0 right-0 h-full w-full max-w-md bg-stone-50 z-[70] shadow-2xl flex flex-col border-l border-stone-200"
            >
              <div className="h-16 px-8 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
                <h3 className="font-bold text-stone-800 uppercase text-xs tracking-widest">
                  {editingSpecies ? 'Edit Species' : 'Catalog New Species'}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Common Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. African Mahogany"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none text-sm font-medium focus:border-emerald-600 transition-colors"
                    value={formData.common_name}
                    onChange={(e) => setFormData({ ...formData, common_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">Scientific Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Khaya senegalensis"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg outline-none text-sm font-medium focus:border-emerald-600 transition-colors"
                    value={formData.scientific_name}
                    onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold text-sm tracking-widest uppercase shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Processing...' : (editingSpecies ? 'Update Catalog' : 'Add to Catalog')}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
