import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://otxueawzqduoehlaopfp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eHVlYXd6cWR1b2VobGFvcGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NzU2NzQsImV4cCI6MjA4MzE1MTY3NH0.ScfxSlc-ul4j7Epzf_bFxCkGRhw_2LtaLLF5X3rAflQ'
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || null

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client za seed operacije (koristi service role key ako je dostupan)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

