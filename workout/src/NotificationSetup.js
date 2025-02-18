// NotificationSetup.js
import React, { useState, useEffect } from 'react';
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';

function NotificationSetup() {
  const [fcmToken, setFcmToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);


  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Use process.env.PUBLIC_URL to get the correct subdirectory path.
        const registration = await navigator.serviceWorker.register(
          `${process.env.PUBLIC_URL}/firebase-messaging-sw.js`
        );
        console.log('Service Worker registered with scope:', registration.scope);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
    return null;
  };

  // Function to send the token to your Cloud Function endpoint
  async function sendTokenToServer(token) {
    try {
      const response = await fetch(
        'https://us-central1-teamworkouttracker-e5151.cloudfunctions.net/registerToken',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('Token sent to server successfully.');
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  const registerForPush = async () => {
    setHasRequestedPermission(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register the service worker and pass its registration to getToken.
        const registration = await registerServiceWorker();
        if (registration) {
          try {
            const token = await getToken(messaging, {
              vapidKey:
                'BOeqlVSpOf0vz3f1skUczrysns7tOT6hTS1P1lbHcKR3oiQuersNfnWdTUNc5Lgh9iVUNJ1blLK6xOSdV5sOysY',
              serviceWorkerRegistration: registration,
            });
            if (token) {
              console.log('FCM Token:', token);
              setFcmToken(token);
              // Send the token to your backend Cloud Function.
              sendTokenToServer(token);
            } else {
              console.log('No registration token available');
            }
          } catch (error) {
            console.error('Error retrieving FCM token:', error);
          }
        }
      } else {
        console.log('Permission for notifications was not granted.');
      }
    } catch (err) {
      console.error('Notification permission request error:', err);
    }
  };

  useEffect(() => {
    // Listen for messages when app is in the foreground.
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      setNotification(payload.notification);
    });
    return () => unsubscribe();
  }, []);

//   return (
//     <div style={{ padding: '1rem', background: '#f9f9f9', marginBottom: '1rem' }}>
//       {!hasRequestedPermission && (
//         <button onClick={registerForPush}>Enable Notifications</button>
//       )}

//       {fcmToken && <p>Push notifications enabled. Your token: {fcmToken}</p>}

//       {notification && (
//         <div style={{ background: '#eee', padding: '1rem', borderRadius: '4px' }}>
//           <h3>{notification.title}</h3>
//           <p>{notification.body}</p>
//         </div>
//       )}
//     </div>
//   );
// }

return (
    <div style={{ padding: '1rem', background: '#f9f9f9', marginBottom: '1rem' }}>
      {!hasRequestedPermission && (
        <button onClick={registerForPush}>Enable Notifications</button>
      )}

      {hasRequestedPermission && notificationsEnabled && (
        <p>Push notifications enabled.</p>
      )}

      {notification && (
        <div style={{ background: '#eee', padding: '1rem', borderRadius: '4px' }}>
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
        </div>
      )}
    </div>
  );
}

export default NotificationSetup;
