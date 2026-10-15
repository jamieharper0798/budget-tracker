/**
 * Firebase web config. These values are not secret — they identify which
 * Firebase project the client talks to; access control lives in Firestore
 * security rules, not in hiding this object. Safe to commit.
 *
 * Replace the placeholders below with the values from
 * Firebase console → Project settings → Your apps → SDK setup and config.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBWkQ6fni7tGpCN-tsgd2cwWt0U1vDdcXo',
  authDomain: 'budget-tracker-a881d.firebaseapp.com',
  projectId: 'budget-tracker-a881d',
  storageBucket: 'budget-tracker-a881d.firebasestorage.app',
  messagingSenderId: '978276813707',
  appId: '1:978276813707:web:0141009a4eba5665dabd8e',
};

export const firebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY';
