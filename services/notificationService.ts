import admin from 'firebase-admin';
import path from 'path';

// Note: Ensure you have your Firebase service account JSON file
// in the root of your server project (e.g., as 'firebase-service-account.json')
// or set the GOOGLE_APPLICATION_CREDENTIALS environment variable.

import fs from 'fs';

const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

try {
  if (!admin.apps.length) {
    if (fs.existsSync(serviceAccountPath)) {
      // Preferred method: Load from service account file
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('[Firebase] Admin initialized using service account file');
    } else {
      // Fallback: Load from environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      // Clean the private key: remove quotes and handle escaped newlines
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ?.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n');

      // console.log({ projectId, clientEmail, privateKey });


      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('[Firebase] Admin initialized using environment variables');
      } else {
        console.error('[Firebase] Failed to initialize: No service account file or missing environment variables');
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('[Firebase] Admin initialized with applicationDefault');
      }
    }
  }
} catch (error) {
  console.error('[Firebase] Admin init error:', error);
}

export const sendPushNotification = async (
  targetToken: string,
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  if (!targetToken) {
    return;
  }

  // Transform data object to strictly strings as required by FCM data property
  const stringifiedData: { [key: string]: string } = {};
  if (data) {
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        stringifiedData[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      }
    }
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: stringifiedData,
    token: targetToken,
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'orders-v3',
        sound: 'notificationsound',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[Push] Notification sent successfully:', response);
  } catch (error) {
    console.error('[Push] sendPushNotification failed for token:', targetToken, error);
  }
};
