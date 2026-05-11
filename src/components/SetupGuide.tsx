import { Terminal, Database, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function SetupGuide() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Simple health check query
      const { data, error } = await supabase.from('plots').select('count', { count: 'exact', head: true });
      
      if (error) {
        // If error is "relation does not exist", the connection is OK but tables are missing
        if (error.code === '42P01') {
          setTestResult({ 
            success: true, 
            message: 'Connected to Supabase! However, the "plots" table was not found. Please run the SQL script below.' 
          });
        } else {
          throw error;
        }
      } else {
        setTestResult({ 
          success: true, 
          message: 'Connection successful! Tables are correctly initialized.' 
        });
      }
    } catch (error: any) {
      console.error('Test connection error:', error);
      setTestResult({ 
        success: false, 
        message: `Connection failed: ${error.message || 'Check your URL and API key'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const sql = `
-- 1. Create Plots table
CREATE TABLE IF NOT EXISTS plots (
    plot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sector_name VARCHAR NOT NULL,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    area_hectares DECIMAL NOT NULL,
    baseline_land_use VARCHAR,
    project_start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Species table
CREATE TABLE IF NOT EXISTS species (
    species_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    common_name VARCHAR NOT NULL,
    scientific_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Trees table
CREATE TABLE IF NOT EXISTS trees (
    tree_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID REFERENCES plots(plot_id) ON DELETE CASCADE,
    tree_type VARCHAR NOT NULL,
    planting_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (Wrap in DO block to avoid 'already exists' errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to plots') THEN
        CREATE POLICY "Allow all access to plots" ON plots FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to species') THEN
        CREATE POLICY "Allow all access to species" ON species FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to trees') THEN
        CREATE POLICY "Allow all access to trees" ON trees FOR ALL USING (true);
    END IF;
END
$$;
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <section className="bg-white p-8 rounded-3xl border border-[#E5E7EB] shadow-sm">
        <div className="flex items-start gap-6">
          <div className="bg-[#10B981]/10 p-4 rounded-2xl text-[#10B981]">
            <Database size={32} />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Connect your Supabase Project</h3>
            <p className="text-[#6B7280] leading-relaxed">
              To start tracking reforestation efforts, you need to connect this app to your Supabase project. 
              Follow the steps below to set up your database schema.
            </p>
            
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={testConnection}
                disabled={testing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 w-fit shadow-md"
              >
                {testing ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
                {testing ? 'Testing...' : 'Test Database Connection'}
              </button>

              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                PWA Support Enabled (Installable)
              </div>

              <AnimatePresence>
                {testResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-xl text-sm font-medium flex items-start gap-3 border ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {testResult.success ? <Check size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                    <span>{testResult.message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#10B981]">
            <span className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold">1</span>
            <h4 className="font-semibold">Setup Environment</h4>
          </div>
          <p className="text-sm text-[#6B7280]">
            Update your <code className="bg-gray-100 px-1 rounded text-pink-600">.env</code> file with 
            your <span className="font-medium text-[#1A1A1A]">Project URL</span> and <span className="font-medium text-[#1A1A1A]">Anon Key</span> found in 
            the Supabase Project Settings.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5E7EB] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#10B981]">
            <span className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold">2</span>
            <h4 className="font-semibold">Initialize Database</h4>
          </div>
          <p className="text-sm text-[#6B7280]">
            Run the SQL script provided below in your Supabase SQL Editor to create 
            the <code className="bg-gray-100 px-1 rounded text-pink-600">plots</code> and <code className="bg-gray-100 px-1 rounded text-pink-600">trees</code> tables.
          </p>
        </div>
      </div>

      <div className="bg-[#1E1E1E] rounded-3xl overflow-hidden shadow-xl border border-[#333]">
        <div className="flex items-center justify-between px-6 py-4 bg-[#2D2D2D]">
          <div className="flex items-center gap-2 text-gray-300">
            <Terminal size={18} />
            <span className="text-sm font-mono tracking-tight">schema.sql</span>
          </div>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/5"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy SQL'}
          </button>
        </div>
        <div className="p-6">
          <pre className="text-green-400 font-mono text-sm overflow-x-auto whitespace-pre">
            {sql}
          </pre>
        </div>
      </div>
    </div>
  );
}
