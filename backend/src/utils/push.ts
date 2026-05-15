import webpush from 'web-push';
import prisma from './prisma.js';

// VAPID keys should ideally be in .env, but for MVP we hardcode or use process.env
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BPghLxKuTeNUFLLSNLBDWZ4WMwTQSSKGwyJcfFE_mcVM2UDAAV8nE001w-5Jag0N4kI044jSZAeZgnaQ7mexZH0';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'JFO_lsqMCZ8lG1BONZimVp_62fCm-rot8TANYYkwA3k';

webpush.setVapidDetails(
  'mailto:contact@je-depanne.com',
  publicVapidKey,
  privateVapidKey
);

export const sendPushNotification = async (userId: string, title: string, body: string, url: string = '/dashboard') => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: '/images/logo-jd-color.svg'
    });

    const notifications = subscriptions.map(sub => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSub, payload).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('Subscription has expired or is no longer valid: ', err);
          return prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
        } else {
          console.error('Error sending push notification: ', err);
        }
      });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
};
