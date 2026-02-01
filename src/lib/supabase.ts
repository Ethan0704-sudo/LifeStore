import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase 配置缺失！请在 .env 文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || "",
);
