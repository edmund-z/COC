import twilio from "twilio";
import { appConfig } from "./config";

function getClient() {
  return twilio(appConfig.twilioSid, appConfig.twilioAuth);
}

export async function sendSms(to: string, body: string): Promise<void> {
  await getClient().messages.create({ to, from: appConfig.twilioFrom, body });
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
