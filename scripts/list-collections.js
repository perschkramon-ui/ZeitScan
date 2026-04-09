#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function listCollections() {
  try {
    console.log('\n📚 Alle Collections in Firestore:\n');
    
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('  (Keine Collections vorhanden)');
    } else {
      for (const collection of collections) {
        const collectionName = collection.id;
        const snapshot = await collection.limit(3).get();
        const count = (await collection.get()).size;
        
        console.log(`📁 ${collectionName} (${count} Dokumente)`);
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const email = data.email || data.mail || data.userEmail || '-';
          const name = data.name || data.userName || '-';
          console.log(`   └─ {id: "${doc.id}", email: "${email}", name: "${name}"}`);
        });
        console.log('');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

listCollections();
