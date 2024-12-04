import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Log only on the client side
if (import.meta.env.MODE === "development") {
  console.log("Supabase URL and Anon Key:");
  console.log(supabaseUrl, supabaseAnonKey);
}
console.log(supabaseUrl, supabaseAnonKey);
export default supabase;
