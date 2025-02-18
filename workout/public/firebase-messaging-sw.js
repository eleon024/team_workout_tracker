importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCs58Aelvq2MyTT0K6oV6vKosRnPl4Gug8",
  authDomain: "teamworkouttracker-e5151.firebaseapp.com",
  projectId: "teamworkouttracker-e5151",
  storageBucket: "teamworkouttracker-e5151.firebasestorage.app",
  messagingSenderId: "872018982836",
  appId: "1:872018982836:web:b1e9684b5061cd787824e1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
