import { useState, useEffect, type FormEvent } from 'react';
import { supabase, Plot } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Maximize2,
  MoreVertical,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PlotList() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    sector_name: '',
    latitude: '',
    longitude: '',
    area_hectares: '',
    baseline_land_use: '',
    project_start_date: new Date().toISOString().split('T')[0]
  });

  const fetchPlots = async () => {
    try {
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPlots(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Submitting plot form:', formData);
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('plots')
        .insert([{
          ...formData,
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
          area_hectares: parseFloat(formData.area_hectares) || 0
        }]);

      if (error) {
        console.error('Supabase Error details:', error);
        throw error;
      }
      
      setShowForm(false);
      fetchPlots();
      setFormData({
        sector_name: '',
        latitude: '',
        longitude: '',
        area_hectares: '',
        baseline_land_use: '',
        project_start_date: new Date().toISOString().split('T')[0]
      });
    } catch (error: any) {
      const msg = error.message || 'Unknown error';
      alert(`Error creating plot: ${msg}\n\nCheck console for full technical details.`);
      console.error('Full caught error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plot and all its associated trees?')) return;
    try {
      await supabase.from('plots').delete().eq('plot_id', id);
      fetchPlots();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredPlots = plots.filter(p => 
    p.sector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.baseline_land_use.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-2xl w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
          <input
            type="text"
            placeholder="Search sectors or land use..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 outline-none transition-all text-sm text-stone-900 placeholder:text-stone-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-6 py-4 md:py-3 bg-stone-900 text-white rounded-lg text-sm font-bold active:bg-black md:hover:bg-black transition-all shadow-lg w-full md:w-auto"
        >
          <Plus size={18} />
          Add Sector
        </button>
      </div>

      {loading && plots.length === 0 ? (
        <div className="h-[40vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <AnimatePresence>
            {filteredPlots.map((plot) => (
              <motion.div
                key={plot.plot_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-5 md:p-6 rounded-2xl border border-stone-200 shadow-theme-sm md:hover:shadow-theme-lg transition-all group relative active:bg-stone-50 md:active:bg-white"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-stone-900 tracking-tight leading-tight">{plot.sector_name}</h3>
                    <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mt-0.5">{plot.baseline_land_use}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(plot.plot_id)}
                    className="p-2 text-stone-400 hover:text-red-600 active:text-red-700 active:bg-red-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                    aria-label={`Delete ${plot.sector_name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-100 my-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-600 uppercase font-bold tracking-widest">COORDINATES</p>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-stone-700">
                      < MapPin size={12} className="text-emerald-700 shrink-0" />
                      <span className="truncate">{plot.latitude.toFixed(3)}, {plot.longitude.toFixed(3)}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-stone-600 uppercase font-bold tracking-widest">TOTAL AREA</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                      <Maximize2 size={12} className="text-blue-700 shrink-0" />
                      {plot.area_hectares} HA
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-200 max-w-[60%]">
                    <Calendar size={12} className="text-stone-600 shrink-0" />
                    <span className="text-[10px] font-bold text-stone-700 uppercase tracking-tight truncate">
                      {new Date(plot.project_start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-stone-500 font-bold uppercase shrink-0">
                    ID: {plot.plot_id.slice(0, 8)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredPlots.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-300">
                <MapPin size={32} />
              </div>
              <p className="text-stone-400 font-medium text-sm">No sectors matched your search.</p>
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
                <h3 className="font-bold text-stone-800 tracking-tight uppercase text-sm">New Plot Registration</h3>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 flex-1 overflow-auto space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest pl-1">Sector Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Amazon Basin Alpha"
                    className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-medium text-stone-900"
                    value={formData.sector_name}
                    onChange={(e) => setFormData({ ...formData, sector_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest pl-1">Latitude</label>
                    <input
                      required
                      type="number"
                      step="any"
                      placeholder="GPS Lat"
                      className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-mono text-stone-900"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest pl-1">Longitude</label>
                    <input
                      required
                      type="number"
                      step="any"
                      placeholder="GPS Long"
                      className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-mono text-stone-900"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest pl-1">Area (Hectares)</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder="Size"
                    className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-medium text-stone-900"
                    value={formData.area_hectares}
                    onChange={(e) => setFormData({ ...formData, area_hectares: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest pl-1">Baseline Land Use</label>
                  <input
                    type="text"
                    placeholder="Primary state"
                    className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-medium text-stone-900"
                    value={formData.baseline_land_use}
                    onChange={(e) => setFormData({ ...formData, baseline_land_use: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-700 uppercase tracking-widest pl-1">Project Start Date</label>
                  <input
                    required
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-stone-300 focus:border-emerald-700 rounded-lg transition-all outline-none text-sm font-medium text-stone-900"
                    value={formData.project_start_date}
                    onChange={(e) => setFormData({ ...formData, project_start_date: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 text-white rounded-lg font-bold text-sm tracking-widest uppercase shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all disabled:opacity-50 mt-4"
                >
                  {submitting ? 'Processing...' : 'Register Land Plot'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
