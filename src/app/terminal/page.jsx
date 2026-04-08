"use client";

import { useEffect, useState } from "react";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export default function TerminalPage() {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("No user → signing in anonymously...");
        signInAnonymously(auth).catch(console.error);
        return;
      }

      console.log("Auth ready:", user.uid);

      const firestore = getFirestore(app);
      setDb(firestore);

      loadEmployees(firestore);
    });

    return () => unsub();
  }, []);

  return (
    <div>
      <h1>Terminal</h1>
      {/* UI kommt hier */}
    </div>
  );
}

function loadEmployees(db) {
  console.log("Loading employees with DB:", db);
  // hier deine Firestore-Abfrage
}
