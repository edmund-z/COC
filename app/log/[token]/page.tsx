import { db } from "@/lib/supabase";
import LogClient from "./LogClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function LogPage({ params }: Props) {
  const { token } = await params;

  const tokenRow = await db.getToken(token).catch(() => null);

  if (!tokenRow) {
    return <LogClient token={token} initialError="Invalid or expired link." />;
  }
  if (tokenRow.used) {
    return <LogClient token={token} initialError="This link has already been used." />;
  }
  if (new Date(tokenRow.expires_at) < new Date()) {
    return <LogClient token={token} initialError="This link has expired." />;
  }

  const existing = await db.getEntryForDate(tokenRow.date).catch(() => null);
  if (existing) {
    return <LogClient token={token} initialError="Already logged for today." />;
  }

  return <LogClient token={token} />;
}
