import twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_SID;
  const auth = process.env.TWILIO_AUTH;
  if (!sid || !auth) throw new Error("Missing Twilio env vars");
  return twilio(sid, auth);
}

export async function sendSms(to: string, body: string): Promise<void> {
  const from = process.env.TWILIO_FROM;
  if (!from) throw new Error("TWILIO_FROM not set");
  await getClient().messages.create({ to, from, body });
}

export function parseSmsChoice(body: string): "create" | "consume" | null {
  const normalized = body.trim().toLowerCase();
  if (normalized === "c" || normalized === "create") return "create";
  if (normalized === "x" || normalized === "consume") return "consume";
  return null;
}

export function twilioXml(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
