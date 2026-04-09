#!/usr/bin/env node

/**
 * Skript zum Verlängern der Trial-Periode um 15 Tage für einen Kunden
 * Usage: node scripts/extend-trial.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK initialisieren
// WICHTIG: Du benötigst eine service-account-key.json im Projektroot
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Fehler: service-account-key.json nicht gefunden!');
  console.error(`Erwartet in: ${serviceAccountPath}`);
  console.error('\nSo erhältst du den Service Account Key:');
  console.error('1. Gehe zu Firebase Console: https://console.firebase.google.com');
  console.error('2. Wähle Projekteinstellungen (Zahnrad-Icon)');
  console.error('3. Gehe zum Tab "Dienstkonten"');
  console.error('4. Klicke "Neuen privaten Schlüssel generieren"');
  console.error('5. Speichere die JSON-Datei als service-account-key.json im Projektroot\n');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function extendTrial(email) {
  try {
    console.log(`\n🔍 Suche Kunden mit E-Mail: ${email}`);
    
    // Kunden in der "adminUsers" Collection suchen
    const customersSnapshot = await db
      .collection('adminUsers')
      .where('email', '==', email)
      .get();

    if (customersSnapshot.empty) {
      console.error(`\n❌ Kein Kunde mit E-Mail "${email}" gefunden`);
      process.exit(1);
    }

    const customerDoc = customersSnapshot.docs[0];
    const customerId = customerDoc.id;
    const customerData = customerDoc.data();

    console.log(`✅ Kunde gefunden: ${customerData.name || 'Unbekannt'}`);
    console.log(`   UID: ${customerId}`);
    
    // Aktuelle Trial-Info anzeigen
    if (customerData.trialStartedAt) {
      const start = new Date(customerData.trialStartedAt);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const currentDaysLeft = Math.max(0, 30 - diffDays);
      console.log(`\n📅 Aktuelle Trial-Tage übrig: ${currentDaysLeft}`);
    } else {
      console.log(`\n📅 Aktuelles trialStartedAt: Nicht gesetzt`);
    }
    
    // Neues trialStartedAt berechnen (15 Tage zurück, damit 15 Tage übrig bleiben)
    const newTrialStart = new Date();
    newTrialStart.setDate(newTrialStart.getDate() - 15);
    
    console.log(`📅 Neues trialStartedAt: ${newTrialStart.toLocaleDateString('de-DE')}`);
    
    // Datenbank aktualisieren
    await db.collection('adminUsers').doc(customerId).update({
      trialStartedAt: newTrialStart.toISOString(),
      isPremium: true, // Sicherstellen, dass Premium aktiviert ist
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`\n✅ Trial-Periode erfolgreich um 15 Tage verlängert!`);
    console.log(`   Kunde: ${customerData.email}`);
    console.log(`   Neuer Trial-Start: ${newTrialStart.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Fehler beim Verlängern der Trial-Periode:`, error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('\n❌ E-Mail-Adresse erforderlich!');
  console.error('Usage: node scripts/extend-trial.js <email>\n');
  console.error('Beispiel: node scripts/extend-trial.js rechnung.obstgaertla@gmail.com\n');
  process.exit(1);
}

extendTrial(email);
