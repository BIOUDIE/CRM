// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDAGh6d-ANtRYCdFO-X_h2cYXxHmuflYjY",
  authDomain: "elektro-micro-crm-44df0.firebaseapp.com",
  projectId: "elektro-micro-crm-44df0",
  storageBucket: "elektro-micro-crm-44df0.firebasestorage.app",
  messagingSenderId: "800547908958",
  appId: "1:800547908958:web:33435ce327db23b79af3cf",
  measurementId: "G-W3HXE1B8NF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
