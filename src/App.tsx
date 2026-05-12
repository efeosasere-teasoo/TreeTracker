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
  Leaf,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Add type for PWA prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
  };

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
    <div className="flex flex-col md:flex-row h-screen bg-stone-50 text-stone-800 font-sans overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-white border-r border-stone-200 flex-col shrink-0">
        <div className="h-16 px-6 lg:px-8 flex items-center gap-3 border-b border-stone-200">
          <div className="bg-emerald-700 w-8 h-8 rounded flex items-center justify-center text-white shadow-sm">
            <TreePine size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-stone-900 uppercase">TreeTracker</h1>
        </div>

        <div className="p-6 flex-1 flex flex-col space-y-6">
          <nav className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-600 block mb-3 pl-2">Management</label>
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => setCurrentView(item.id as View)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  currentView === item.id
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 font-semibold shadow-sm'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
                aria-current={currentView === item.id ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={currentView === item.id ? 'text-emerald-700' : 'text-stone-500 group-hover:text-stone-700'} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {currentView === item.id && (
                  <motion.div layoutId="active-indicator" className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                )}
              </button>
            ))}
          </nav>

          {!isConfigured && (
            <div className="mt-auto p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <button 
                onClick={() => setCurrentView('setup')}
                className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider"
              >
                <Database size={14} />
                <span>Fix Connection</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-stone-200 text-stone-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-700">
              EO
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">Efe Osasere</p>
              <p className="text-[10px] text-stone-600 font-bold uppercase tracking-tight truncate">Project Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-20 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden h-14 bg-white border-b border-stone-200 px-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-700 w-6 h-6 rounded flex items-center justify-center text-white">
              <TreePine size={14} />
            </div>
            <h1 className="font-bold text-sm tracking-tight text-stone-900 uppercase">TreeTracker</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-stone-200 active:scale-95 transition-all"
                aria-label="Install App to Homescreen"
              >
                <Download size={12} />
                <span>Download</span>
              </button>
            )}
            <h2 className="text-xs font-black text-stone-600 uppercase tracking-widest truncate max-w-[80px]">
              {currentView === 'setup' ? 'Setup' : currentView}
            </h2>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 bg-white border-b border-stone-200 px-8 items-center justify-between shrink-0 shadow-sm text-stone-900">
          <h2 className="text-lg font-bold tracking-tight capitalize">
            {currentView === 'setup' ? 'Configuration' : currentView}
          </h2>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4 text-xs font-bold text-stone-600 uppercase tracking-widest border-r border-stone-200 pr-6" aria-label="Region selection">
              <span className="text-emerald-800 border-b-2 border-emerald-800 pb-1">Primary</span>
              <span className="hover:text-stone-900 cursor-pointer transition-colors">Regional</span>
              <span className="hover:text-stone-900 cursor-pointer transition-colors">Global</span>
            </nav>
            <button className="p-2 text-stone-500 hover:text-stone-700 transition-colors" aria-label="More Info">
              <Info size={20} />
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full"
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

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-stone-200 flex items-center justify-around px-2 pb-safe z-50">
          {menuItems.map((item) => (
            <button
              key={item.id}
              id={`nav-mobile-${item.id}`}
              onClick={() => setCurrentView(item.id as View)}
              className="flex flex-col items-center gap-1 min-w-[64px] transition-all"
              aria-label={item.label}
              aria-current={currentView === item.id ? 'page' : undefined}
            >
              <div className={`p-2 rounded-xl transition-all ${
                currentView === item.id 
                  ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-200' 
                  : 'text-stone-500'
              }`}>
                <item.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${
                currentView === item.id ? 'text-emerald-800' : 'text-stone-600'
              }`}>
                {item.label === 'Database Setup' ? 'Setup' : item.label}
              </span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
