#!/usr/bin/env node

/**
 * Skript zum Überprüfen der aktuellen Trial-Daten eines Kunden
 * Usage: node scripts/check-trial.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK initialisieren
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Fehler: service-account-key.json nicht gefunden!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function checkTrial(email) {
  try {
    console.log(`\n🔍 Suche Kunden mit E-Mail: ${email}`);

    const snapshot = await db
      .collection('adminUsers')
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      console.error(`\n❌ Kein Kunde gefunden`);
      process.exit(1);
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    console.log(`✅ Kunde gefunden: ${data.email}`);
    console.log(`   UID: ${doc.id}`);
    console.log(`   isPremium: ${data.isPremium}`);
    console.log(`   trialStartedAt: ${data.trialStartedAt || 'Nicht gesetzt'}`);
    console.log(`   trialEndsAt: ${data.trialEndsAt ? new Date(data.trialEndsAt.toDate ? data.trialEndsAt.toDate() : data.trialEndsAt).toLocaleDateString('de-DE') : 'Nicht gesetzt'}`);

    // Trial-Berechnung wie in der App
    if (data.trialStartedAt) {
      const start = new Date(data.trialStartedAt);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, 30 - diffDays);
      const expired = daysLeft <= 0;

      console.log(`\n📊 Trial-Status (App-Logik):`);
      console.log(`   Tage seit Start: ${diffDays}`);
      console.log(`   Tage übrig: ${daysLeft}`);
      console.log(`   Abgelaufen: ${expired}`);
      console.log(`   Features aktiv: ${!expired}`);
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('❌ Verwendung: node scripts/check-trial.js <email>');
  process.exit(1);
}

checkTrial(email);