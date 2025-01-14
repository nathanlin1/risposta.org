import { supabase } from "lib/db.ts";

export async function upsertSession(id: string, user_id: number) {
  const { error, data } = await supabase.from("sessions").upsert({
    id,
    user_id,
  }).select("*");
  if (error) return null;
  return data;
}
