import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCvNwbM1B-ySP6gNWz1A9ESk5IvNQy0wgY",
  authDomain: "pung-pong.firebaseapp.com",
  projectId: "pung-pong",
  storageBucket: "pung-pong.firebasestorage.app",
  messagingSenderId: "742806617606",
  appId: "1:742806617606:web:f1643d069b9e1b4c118d87",
  measurementId: "G-6EY41VHQKH",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const functions = getFunctions(app, "europe-west1");

export const getMsg = async () => {
  if (await isSupported()) return getMessaging(app);
  return null;
};

export const VAPID_KEY = "BLif9DBsVeYOPqRfhhBZsftnDbJvWfbfVrkjf14s7HsygsnYh4yfIKOr30oM58jIakPKBDu0arXj5oEZWhWG-E0";
