import { initializeApp, getApp, getApps } from 'firebase/app';

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDnLe19AROWc5zrNMArCn8dhJTzpzcWECY',
  authDomain: 'prepwise-9820b.firebaseapp.com',
  projectId: 'prepwise-9820b',
  storageBucket: 'prepwise-9820b.firebasestorage.app',
  messagingSenderId: '514592303075',
  appId: '1:514592303075:web:2d7baae2f7c273a77462d6',
  measurementId: 'G-XW03J16X2S',
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();


export const auth = getAuth(app);
export const db = getFirestore(app);