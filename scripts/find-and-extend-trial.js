#!/usr/bin/env node

/**
 * Skript zum Suchen und Verlängern der Trial-Periode
 * Usage: node scripts/find-and-extend-trial.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

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

async function findAndExtendTrial(searchEmail) {
  try {
    console.log(`\n🔍 Suche Kunden mit E-Mail: ${searchEmail}\n`);
    
    const emailLower = searchEmail.toLowerCase();
    
    // Versuche zuerst direkte Abfrage
    let customersSnapshot = await db
      .collection('customers')
      .where('email', '==', searchEmail)
      .get();

    // Falls nicht gefunden, versuche case-insensitive Suche
    if (customersSnapshot.empty) {
      console.log('  Versuche case-insensitive Suche...');
      const allCustomers = await db.collection('customers').get();
      
      const matching = allCustomers.docs.filter(doc => {
        const data = doc.data();
        return data.email && data.email.toLowerCase() === emailLower;
      });
      
      if (matching.length > 0) {
        customersSnapshot = {
          docs: matching,
          empty: false
        };
      }
    }

    if (customersSnapshot.empty) {
      console.error(`❌ Kein Kunde mit E-Mail "${searchEmail}" gefunden\n`);
      
      // Zeige alle Kunden zur Hilfe
      console.log('📋 Alle vorhandenen Kunden:');
      const allCustomers = await db.collection('customers').get();
      
      if (allCustomers.empty) {
        console.log('  (Keine Kunden in der Datenbank)\n');
      } else {
        allCustomers.docs.forEach((doc, i) => {
          const data = doc.data();
          console.log(`  ${i + 1}. ${data.email || 'Keine Email'} - ${data.name || 'Kein Name'}`);
        });
        console.log('');
      }
      
      process.exit(1);
    }

    const customerDoc = customersSnapshot.docs[0];
    const customerId = customerDoc.id;
    const customerData = customerDoc.data();

    console.log(`✅ Kunde gefunden!`);
    console.log(`   Name: ${customerData.name || 'N/A'}`);
    console.log(`   Email: ${customerData.email}`);
    console.log(`   UID: ${customerId}`);
    
    // Aktuelles Trial-Enddatum
    const currentTrialEnd = customerData.trialEndsAt 
      ? new Date(customerData.trialEndsAt.toDate ? customerData.trialEndsAt.toDate() : customerData.trialEndsAt)
      : null;
    
    console.log(`\n📅 Aktuelles Trial-Enddatum: ${currentTrialEnd ? currentTrialEnd.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Nicht gesetzt'}`);
    
    // Neues Enddatum berechnen (15 Tage verlängern)
    const newTrialEnd = new Date(currentTrialEnd || new Date());
    newTrialEnd.setDate(newTrialEnd.getDate() + 15);
    
    console.log(`📅 Neues Trial-Enddatum: ${newTrialEnd.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    // Datenbank aktualisieren
    await db.collection('customers').doc(customerId).update({
      trialEndsAt: admin.firestore.Timestamp.fromDate(newTrialEnd),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`\n✅ Trial-Periode erfolgreich um 15 Tage verlängert!\n`);
    
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Fehler:`, error.message);
    process.exit(1);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('\n❌ E-Mail-Adresse erforderlich!');
  console.error('Usage: node scripts/find-and-extend-trial.js <email>\n');
  console.error('Beispiel: node scripts/find-and-extend-trial.js rechnung.obstgaertla@gmail.com\n');
  process.exit(1);
}

findAndExtendTrial(email);
