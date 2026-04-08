import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  // deine config
};

export const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];
