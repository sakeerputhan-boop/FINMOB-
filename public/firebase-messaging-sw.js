// Firebase Cloud Messaging Service Worker for MYFIN PWA
// Target Project ID: finmob-7e007
// Target Project Number / Messaging Sender ID: 55757491863

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForFinmob7e007PlaceHolder",
  authDomain: "finmob-7e007.firebaseapp.com",
  projectId: "finmob-7e007",
  storageBucket: "finmob-7e007.appspot.com",
  messagingSenderId: "55757491863",
  appId: "1:55757491863:web:a1b2c3d4e5f6g7h8i9j0k1"
};

// Initialize Firebase in Service Worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'MYFIN Financial Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new financial alert or due date reminder.',
    icon: payload.notification?.icon || '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: payload.data?.tag || 'myfin-push-alert',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to focus or open the MYFIN PWA window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
