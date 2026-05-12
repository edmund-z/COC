import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";

export type Choice = "create" | "consume";

export interface Entry {
  id: string;
  date: string;
  choice: Choice;
  why_word: string | null;
  created_at: string;
  auto_logged: boolean;
}

export interface Token {
  token: string;
  date: string;
  used: boolean;
  expires_at: string;
}

export interface Settings {
  id: number;
  timezone: string;
  phone: string;
  last_summary_sent: string | null;
  push_subscription: Record<string, unknown> | null;
}

function getClient() {
  return createClient(appConfig.supabaseUrl, appConfig.supabaseKey);
}

export const db = {
  async fetchSettings(): Promise<Settings> {
    const { data, error } = await getClient()
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return data as Settings;
  },

  async updateSettings(patch: Partial<Omit<Settings, "id">>): Promise<void> {
    const { error } = await getClient()
      .from("settings")
      .update(patch)
      .eq("id", 1);
    if (error) throw error;
  },

  async getEntryForDate(date: string): Promise<Entry | null> {
    const { data, error } = await getClient()
      .from("entries")
      .select("*")
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    return data as Entry | null;
  },

  async insertEntry(
    date: string,
    choice: Choice,
    why_word?: string,
    auto_logged = false
  ): Promise<Entry> {
    const { data, error } = await getClient()
      .from("entries")
      .insert({ date, choice, why_word: why_word ?? null, auto_logged })
      .select()
      .single();
    if (error) throw error;
    return data as Entry;
  },

  async getAllEntries(): Promise<Entry[]> {
    const { data, error } = await getClient()
      .from("entries")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return data as Entry[];
  },

  async getEntriesForMonth(year: number, month: number): Promise<Entry[]> {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    // Use first day of next month minus 1 day to get true last day
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    const { data, error } = await getClient()
      .from("entries")
      .select("*")
      .gte("date", start)
      .lt("date", end);
    if (error) throw error;
    return data as Entry[];
  },

  async getToken(token: string): Promise<Token | null> {
    const { data, error } = await getClient()
      .from("tokens")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    return data as Token | null;
  },

  async insertToken(token: string, date: string, expires_at: string): Promise<void> {
    const { error } = await getClient()
      .from("tokens")
      .insert({ token, date, used: false, expires_at });
    if (error) throw error;
  },

  async markTokenUsed(token: string): Promise<void> {
    const { error } = await getClient()
      .from("tokens")
      .update({ used: true })
      .eq("token", token);
    if (error) throw error;
  },
};
