#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const ADMIN_ID = 'tVkZWHiNeOSvnJQQiND2Eilmm1p2';

async function audit() {
  // Load employees
  const empSnap = await db.collection('employees').where('adminId', '==', ADMIN_ID).get();
  const empMap = {};
  empSnap.forEach(d => { empMap[d.id] = d.data().fullName; });

  // Load all time entries for May
  const entriesSnap = await db.collection('timeEntries').where('adminId', '==', ADMIN_ID).get();

  const anomalies = [];
  const stats = { total: 0, may: 0, modified: 0, capShifted: 0, manualEdit: 0, sourceTerminal: 0, sourceManual: 0, sourceOther: 0 };

  entriesSnap.forEach(d => {
    const e = d.data();
    stats.total++;
    if (!e.clockInTime || !e.clockInTime.startsWith('2026-05')) return;
    stats.may++;

    const clockIn = new Date(e.clockInTime);
    const created = e.createdAt ? new Date(e.createdAt) : null;
    const updated = e.updatedAt ? new Date(e.updatedAt) : null;
    const clockOut = e.clockOutTime ? new Date(e.clockOutTime) : null;

    const src = (e.sourceSystem || 'unknown').toLowerCase();
    if (src === 'terminal') stats.sourceTerminal++;
    else if (src === 'manual' || src === 'admin') stats.sourceManual++;
    else stats.sourceOther++;

    // Check if clockInTime differs from createdAt (shift-start cap or manual edit)
    const diffCreatedMs = created ? Math.abs(clockIn.getTime() - created.getTime()) : 0;
    const diffCreatedMins = Math.round(diffCreatedMs / 60000);

    // Check if updatedAt differs significantly from createdAt (manual edit after creation)
    const diffUpdatedMs = (created && updated) ? Math.abs(updated.getTime() - created.getTime()) : 0;
    const diffUpdatedMins = Math.round(diffUpdatedMs / 60000);

    // Was the entry modified after clock-out?
    const modifiedAfterClockOut = (updated && clockOut) ? updated.getTime() > clockOut.getTime() + 60000 : false;

    if (diffCreatedMins > 2 || modifiedAfterClockOut || (diffUpdatedMins > 120)) {
      stats.modified++;
      const type = [];
      if (diffCreatedMins > 2 && diffCreatedMins <= 60) type.push('CAP (Schichtbeginn?)');
      if (diffCreatedMins > 60) type.push('GROSS ABWEICHUNG clockIn vs createdAt');
      if (modifiedAfterClockOut) type.push('NACH CLOCK-OUT BEARBEITET');
      if (diffUpdatedMins > 120 && !modifiedAfterClockOut) type.push('SPÄTES UPDATE');

      const fmtTime = (d) => d ? d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '-';
      const localTime = (d) => {
        if (!d) return '-';
        // MESZ = UTC+2
        const local = new Date(d.getTime() + 2 * 3600000);
        return local.toISOString().replace('T', ' ').slice(11, 16) + ' MESZ';
      };

      anomalies.push({
        id: d.id,
        emp: empMap[e.employeeId] || e.employeeId,
        date: e.clockInTime.slice(0, 10),
        clockIn: localTime(clockIn),
        clockOut: localTime(clockOut),
        createdAt: fmtTime(created),
        updatedAt: fmtTime(updated),
        diffCreatedMins,
        diffUpdatedMins,
        source: e.sourceSystem || 'unknown',
        type: type.join(' + '),
        exitType: e.exitType || '-',
      });
    }
  });

  console.log('=== STATISTIK MAI 2026 ===');
  console.log(`Einträge gesamt: ${stats.total}`);
  console.log(`Einträge Mai:    ${stats.may}`);
  console.log(`Terminal:        ${stats.sourceTerminal}`);
  console.log(`Manuell:         ${stats.sourceManual}`);
  console.log(`Andere:          ${stats.sourceOther}`);
  console.log(`Anomalien:       ${stats.modified}`);
  console.log('');

  // Sort by date, then employee
  anomalies.sort((a, b) => a.date.localeCompare(b.date) || a.emp.localeCompare(b.emp));

  anomalies.forEach(a => {
    console.log(`${a.date} | ${a.emp}`);
    console.log(`  Kommen:    ${a.clockIn}  |  Gehen: ${a.clockOut}`);
    console.log(`  createdAt: ${a.createdAt}`);
    console.log(`  updatedAt: ${a.updatedAt}`);
    console.log(`  Diff clockIn↔createdAt: ${a.diffCreatedMins} min`);
    console.log(`  Source: ${a.source} | Exit: ${a.exitType}`);
    console.log(`  >>> ${a.type}`);
    console.log('');
  });
}

audit().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
