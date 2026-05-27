import { createClient } from '@supabase/supabase-js';

// Make sure it starts with https:// and matches your project URL exactly
const supabaseUrl = "https://yclbkrfsxfjosclvcmub.supabase.co"; 

// Make sure your long anon public key is wrapped in quotes here
const supabaseAnonKey = "sb_publishable_flseTXMYLSTU_rkbPsgi7A_1HIi4A6s"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);