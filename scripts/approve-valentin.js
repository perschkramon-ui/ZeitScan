#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function approveEntry() {
  const entryId = 'PqNYoXzKbFkNlIjRMRYu'; // Valentin Panajotow 03.05.2026
  const docRef = db.collection('timeEntries').doc(entryId);
  const doc = await docRef.get();

  if (!doc.exists) {
    console.error('Eintrag nicht gefunden:', entryId);
    process.exit(1);
  }

  const data = doc.data();
  console.log('Aktueller Eintrag:');
  console.log(`  clockInTime:        ${data.clockInTime}`);
  console.log(`  clockOutTime:       ${data.clockOutTime}`);
  console.log(`  earlyClockInStatus: ${data.earlyClockInStatus || 'nicht gesetzt'}`);

  await docRef.update({
    earlyClockInStatus: 'approved',
  });

  console.log('\nEintrag aktualisiert: earlyClockInStatus = approved');
  console.log('Valentin 03.05 wird jetzt mit 11:00 MESZ (original clockIn) statt Schichtbeginn angezeigt.');
}

approveEntry().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
