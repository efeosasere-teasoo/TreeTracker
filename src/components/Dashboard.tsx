import { useState, useEffect } from 'react';
import { supabase, Plot, Tree } from '../lib/supabase';
import { 
  TreePine, 
  Map as MapIcon, 
  Leaf, 
  TrendingUp,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalPlots: 0,
    totalTrees: 0,
    totalArea: 0,
    loading: true
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: plotCount, data: plots } = await supabase
          .from('plots')
          .select('area_hectares', { count: 'exact' });
        
        const { count: treeCount } = await supabase
          .from('trees')
          .select('*', { count: 'exact', head: true });

        const totalArea = plots?.reduce((acc, plot) => acc + (Number(plot.area_hectares) || 0), 0) || 0;

        setStats({
          totalPlots: plotCount || 0,
          totalTrees: treeCount || 0,
          totalArea: totalArea,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Active Plots',
      value: stats.totalPlots,
      unit: 'Blocks',
      icon: MapIcon,
      accent: 'text-blue-600',
      bg: 'bg-white',
      view: 'plots'
    },
    {
      title: 'Tree Density',
      value: stats.totalTrees.toLocaleString(),
      unit: '/ha',
      icon: TreePine,
      accent: 'text-emerald-600',
      bg: 'bg-white',
      view: 'trees'
    },
    {
      title: 'Total Area',
      value: stats.totalArea.toFixed(1),
      unit: 'Hectares',
      icon: Leaf,
      accent: 'text-stone-600',
      bg: 'bg-white',
      view: 'plots'
    }
  ];

  if (stats.loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid md:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onNavigate(card.view)}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-theme-sm cursor-pointer hover:border-emerald-200 transition-colors"
          >
            <div className="text-stone-400 text-[10px] font-bold uppercase mb-1 tracking-wider">{card.title}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-stone-800">{card.value}</span>
              <span className={`text-xs font-medium ${card.accent}`}>{card.unit}</span>
            </div>
          </motion.div>
        ))}
        {/* Fill the 4th slot with a dummy metric to match the theme mockup better or keep it as 3 */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-theme-sm">
          <div className="text-stone-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Survivability</div>
          <div className="text-2xl font-bold text-stone-800">94.2%</div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row gap-8 min-h-[400px]">
        {/* Table View Placeholder / Mini List */}
        <div className="flex-[2] bg-white rounded-2xl border border-stone-200 shadow-theme-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-bold text-stone-700">Recent Activity</h2>
            <div className="flex space-x-2 text-[10px] font-bold uppercase tracking-tight">
              <span className="px-2 py-1 bg-stone-100 rounded text-stone-500">Filter: Recent</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Status: Healthy</span>
            </div>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 flex-1">
             <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
               <TrendingUp size={32} />
             </div>
             <div>
               <h4 className="text-stone-800 font-bold">Reforestation Trends</h4>
               <p className="text-stone-400 text-sm max-w-xs mt-1">Detailed growth analytics and carbon sequestration reports will appear here as data is collected.</p>
             </div>
          </div>
        </div>

        {/* Map / Secondary View */}
        <div className="flex-1 flex flex-col space-y-8">
          <div className="flex-1 bg-stone-200 rounded-2xl border border-stone-300 relative overflow-hidden flex items-center justify-center group cursor-pointer">
             <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] group-hover:bg-[background-size:25px_25px] transition-all"></div>
             <div className="relative flex flex-col items-center">
               <div className="w-24 h-24 bg-emerald-600/20 rounded-full border border-emerald-600/30 flex items-center justify-center">
                 <div className="w-12 h-12 bg-emerald-600 rounded-full border-4 border-white shadow-lg"></div>
               </div>
               <span className="mt-4 text-stone-500 text-[10px] font-bold uppercase tracking-widest">Spatial Map Viewer</span>
             </div>
          </div>
          
          <div className="h-48 bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between">
             <div>
               <div className="text-stone-400 text-[10px] font-bold uppercase mb-4 tracking-widest">Recent Sector Update</div>
               <div className="flex items-start space-x-3">
                 <div className="w-1 h-12 bg-emerald-500 rounded-full"></div>
                 <div>
                   <div className="text-sm font-bold text-stone-800">Baseline Verified</div>
                   <div className="text-xs text-stone-500 mt-1 line-clamp-2">Land area and GPS coordinates verified for project eligibility.</div>
                 </div>
               </div>
             </div>
             <div className="text-[10px] text-stone-300 font-bold">14 MAY 2024</div>
          </div>
        </div>
      </div>
    </div>
  );
}
