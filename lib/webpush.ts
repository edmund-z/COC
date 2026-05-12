import webpush from "web-push";
import { appConfig } from "./config";

webpush.setVapidDetails(
  appConfig.vapidEmail,
  appConfig.vapidPublicKey,
  appConfig.vapidPrivateKey
);

export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
