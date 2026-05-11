/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  TreePine, 
  Map as MapIcon, 
  LayoutDashboard, 
  Plus, 
  ChevronRight,
  Database,
  Info,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import PlotList from './components/PlotList';
import TreeList from './components/TreeList';
import SpeciesCatalog from './components/SpeciesCatalog';
import SetupGuide from './components/SetupGuide';

type View = 'dashboard' | 'plots' | 'trees' | 'species' | 'setup';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const checkConfig = () => {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) {
        setIsConfigured(false);
        setCurrentView('setup');
      }
    };
    checkConfig();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'plots', label: 'Sectors', icon: MapIcon },
    { id: 'trees', label: 'Inventory', icon: TreePine },
    { id: 'species', label: 'Catalog', icon: Leaf },
    { id: 'setup', label: 'Database Setup', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-stone-50 text-stone-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col shrink-0">
        <div className="h-16 px-8 flex items-center gap-3 border-b border-stone-200">
          <div className="bg-emerald-600 w-8 h-8 rounded flex items-center justify-center text-white shadow-sm">
            <TreePine size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-emerald-900 uppercase">TreeTracker</h1>
        </div>

        <div className="p-6 flex-1 flex flex-col space-y-6">
          <nav className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-3">Project Management</label>
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setCurrentView(item.id as View)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                  currentView === item.id
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 font-semibold'
                    : 'text-stone-500 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={currentView === item.id ? 'text-emerald-700' : 'text-stone-400'} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {currentView === item.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            ))}
          </nav>

          <div className="pt-4">
            <button 
              onClick={() => setCurrentView('plots')} // Example entry point for "New Entry"
              className="w-full py-3 bg-stone-900 text-white rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              <Plus size={16} />
              <span>New Entry</span>
            </button>
          </div>

          {!isConfigured && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <button 
                onClick={() => setCurrentView('setup')}
                className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider"
              >
                <Database size={14} />
                Setup Required
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-[10px] font-bold text-stone-600">
              EO
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-stone-800 truncate">Efe Osasere</p>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight truncate">Project Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-stone-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-stone-800 tracking-tight capitalize">
              {currentView === 'setup' ? 'Configuration' : currentView}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-4 text-xs font-bold text-stone-400 uppercase tracking-widest border-r border-stone-200 pr-6">
              <span className="text-emerald-700 border-b-2 border-emerald-700 pb-1">Primary</span>
              <span>Regional</span>
              <span>Global</span>
            </div>
            <button className="p-2 text-stone-300 hover:text-stone-500 transition-colors">
              <Info size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentView === 'dashboard' && <Dashboard onNavigate={(v) => setCurrentView(v as View)} />}
                {currentView === 'plots' && <PlotList />}
                {currentView === 'trees' && <TreeList />}
                {currentView === 'species' && <SpeciesCatalog />}
                {currentView === 'setup' && <SetupGuide />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
