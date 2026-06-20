#!/usr/bin/env node

/**
 * Reparatur-Skript: Mai-Einträge bei denen clockInTime > clockOutTime
 * (verursacht durch den Schichtbeginn-Cap im Portal).
 *
 * Findet alle timeEntries im Mai 2026 für den Obstgärtla-Admin,
 * bei denen clockInTime > clockOutTime, und ersetzt clockInTime
 * mit createdAt (der echten Ankunftszeit).
 *
 * Usage: node scripts/fix-may-clockin.js [--dry-run]
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('Fehler: service-account-key.json nicht gefunden!');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const OBSTGAERTLA_EMAIL = 'rechnung.obstgaertla@gmail.com';

async function fixMayClockIns(dryRun) {
  // 1. Find the Obstgärtla admin UID
  const adminsSnap = await db.collection('adminUsers').get();
  let adminId = null;
  adminsSnap.forEach(doc => {
    const data = doc.data();
    if (data.email === OBSTGAERTLA_EMAIL) {
      adminId = doc.id;
    }
  });

  if (!adminId) {
    console.error(`Admin ${OBSTGAERTLA_EMAIL} nicht gefunden.`);
    process.exit(1);
  }
  console.log(`Admin gefunden: ${adminId}`);

  // 2. Query all time entries for this admin, filter May in code
  const entriesSnap = await db.collection('timeEntries')
    .where('adminId', '==', adminId)
    .get();

  // Filter to May 2026 only
  const may2026Start = new Date('2026-05-01T00:00:00');
  const may2026End = new Date('2026-06-01T00:00:00');

  console.log(`${entriesSnap.size} Mai-Einträge gefunden.\n`);

  let fixCount = 0;
  const fixes = [];

  entriesSnap.forEach(doc => {
    const data = doc.data();
    if (!data.clockOutTime || !data.clockInTime) return;

    const clockIn = new Date(data.clockInTime);
    const clockOut = new Date(data.clockOutTime);

    // Skip entries outside May 2026
    if (clockIn < may2026Start || clockIn >= may2026End) return;

    if (clockIn > clockOut) {
      const createdAt = data.createdAt ? new Date(data.createdAt) : null;
      fixes.push({
        id: doc.id,
        employeeName: data.employeeName || data.employeeId,
        clockInTime: data.clockInTime,
        clockOutTime: data.clockOutTime,
        createdAt: data.createdAt,
        newClockInTime: createdAt ? createdAt.toISOString() : null,
      });
      fixCount++;
    }
  });

  if (fixCount === 0) {
    console.log('Keine fehlerhaften Einträge gefunden (clockIn > clockOut).');
    return;
  }

  console.log(`${fixCount} fehlerhafte Einträge gefunden:\n`);

  for (const fix of fixes) {
    console.log(`  ${fix.employeeName}`);
    console.log(`    clockIn:    ${fix.clockInTime}`);
    console.log(`    clockOut:   ${fix.clockOutTime}`);
    console.log(`    createdAt:  ${fix.createdAt || 'FEHLT'}`);
    console.log(`    -> NEU:     ${fix.newClockInTime || 'KANN NICHT REPARIERT WERDEN'}`);
    console.log('');

    if (!dryRun && fix.newClockInTime) {
      await db.collection('timeEntries').doc(fix.id).update({
        clockInTime: fix.newClockInTime,
        updatedAt: new Date().toISOString(),
      });
      console.log(`    REPARIERT.`);
    }
  }

  if (dryRun) {
    console.log(`\nDRY RUN — keine Änderungen vorgenommen. Ohne --dry-run ausführen um zu reparieren.`);
  } else {
    console.log(`\n${fixCount} Einträge repariert.`);
  }
}

const dryRun = process.argv.includes('--dry-run');
console.log(dryRun ? '=== DRY RUN ===' : '=== LIVE MODUS ===');
console.log('');

fixMayClockIns(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fehler:', err);
    process.exit(1);
  });
