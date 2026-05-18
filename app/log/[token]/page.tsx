import { db } from "@/lib/supabase";
import LogClient from "../LogClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function LogTokenPage({ params }: Props) {
  const { token } = await params;

  const tokenRow = await db.getToken(token).catch(() => null);
  if (!tokenRow) return <LogClient initialError="Invalid or expired link." />;
  if (new Date(tokenRow.expires_at) < new Date()) {
    return <LogClient initialError="This link has expired." />;
  }

  const existing = await db.getEntryForDate(tokenRow.date).catch(() => null);
  if (existing) {
    return <LogClient date={tokenRow.date} initialError="Already logged for this day." />;
  }

  return <LogClient date={tokenRow.date} />;
}
