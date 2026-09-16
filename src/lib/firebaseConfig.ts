/**
 * Firebase web config. These values are not secret — they identify which
 * Firebase project the client talks to; access control lives in Firestore
 * security rules, not in hiding this object. Safe to commit.
 *
 * Replace the placeholders below with the values from
 * Firebase console → Project settings → Your apps → SDK setup and config.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const firebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';
