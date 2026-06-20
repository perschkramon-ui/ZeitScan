#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function checkEntries() {
  // Find the employee
  const empSnap = await db.collection('employees')
    .where('fullName', '==', 'Valentin Panajotow')
    .get();

  if (empSnap.empty) {
    // Try partial match
    const allEmps = await db.collection('employees').get();
    allEmps.forEach(d => {
      const data = d.data();
      if (data.fullName && data.fullName.toLowerCase().includes('valentin')) {
        console.log(`Found: ${data.fullName} (${d.id}), adminId: ${data.adminId}`);
      }
    });
    console.log('\nSearching all employees with "valentin"...');
    return;
  }

  const emp = empSnap.docs[0];
  const empData = emp.data();
  console.log(`Employee: ${empData.fullName} (${emp.id})`);
  console.log(`AdminId: ${empData.adminId}\n`);

  // Get all time entries for this employee
  const entriesSnap = await db.collection('timeEntries')
    .where('employeeId', '==', emp.id)
    .get();

  // Filter to 03.05.2026
  const target = '2026-05-03';
  const dayEntries = [];
  entriesSnap.forEach(d => {
    const data = d.data();
    const clockIn = data.clockInTime || '';
    if (clockIn.startsWith(target)) {
      dayEntries.push({ id: d.id, ...data });
    }
  });

  console.log(`Einträge am ${target}: ${dayEntries.length}\n`);
  dayEntries.sort((a, b) => (a.clockInTime || '').localeCompare(b.clockInTime || ''));

  dayEntries.forEach((e, i) => {
    console.log(`--- Eintrag ${i + 1} (${e.id}) ---`);
    console.log(`  clockInTime:  ${e.clockInTime}`);
    console.log(`  clockOutTime: ${e.clockOutTime}`);
    console.log(`  exitType:     ${e.exitType || '-'}`);
    console.log(`  entryType:    ${e.entryType || 'WORK'}`);
    console.log(`  createdAt:    ${e.createdAt}`);
    console.log(`  sourceSystem: ${e.sourceSystem || '-'}`);
    if (e.earlyClockInStatus) console.log(`  earlyStatus:  ${e.earlyClockInStatus}`);
    console.log('');
  });
}

checkEntries().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
