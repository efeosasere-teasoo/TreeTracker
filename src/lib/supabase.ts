import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export type Plot = {
  plot_id: string;
  sector_name: string;
  latitude: number;
  longitude: number;
  area_hectares: number;
  baseline_land_use: string;
  project_start_date: string;
  created_at?: string;
};

export type Tree = {
  tree_id: string;
  plot_id: string;
  tree_type: string;
  planting_date: string;
  created_at?: string;
};

export type Species = {
  species_id: string;
  common_name: string;
  scientific_name: string;
  created_at?: string;
};
