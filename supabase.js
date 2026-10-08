import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Substitua pelas credenciais do seu projeto no Supabase
const SUPABASE_URL = 'https://yhrjnvwiqwhtsughuhhy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tk5prvtNkbsvu20d5mkM4A_Z2DI2PnR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});