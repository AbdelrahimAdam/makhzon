const admin = require('firebase-admin');

// Load service account from the NEW Firebase project
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'saas-inventory-a3fb8',        // your new project ID
  storageBucket: 'saas-inventory-a3fb8.firebasestorage.app'
});

const db = admin.firestore();

async function createSuperAdmin() {
  try {
    console.log('🔥 Creating/Updating Super Admin...');

    // 1️⃣ Ensure a platform company exists (or create it)
    const platformCompanyId = 'platform';
    const platformRef = db.collection('companies').doc(platformCompanyId);
    const platformDoc = await platformRef.get();

    if (!platformDoc.exists) {
      console.log('📦 Platform company not found. Creating it...');
      await platformRef.set({
        name: 'Platform',
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Platform company created with ID:', platformCompanyId);
    } else {
      console.log('✅ Platform company already exists.');
    }

    const email = 'superadmin@elbran.com';
    let uid;

    // 2️⃣ Check if user already exists in Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      uid = userRecord.uid;
      console.log('✅ User already exists in Firebase Auth, UID:', uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create new one
        const newUser = await admin.auth().createUser({
          email: email,
          password: 'Abdoa@90@90@90',
          displayName: 'Super Admin',
          emailVerified: true
        });
        uid = newUser.uid;
        console.log('✅ User created in Firebase Auth, UID:', uid);
      } else {
        throw error; // other error
      }
    }

    // 3️⃣ Create or update Firestore document
    const userDocRef = db.collection('users').doc(uid);
    const userDocSnapshot = await userDocRef.get();

    const userData = {
      uid: uid,
      name: 'Super Admin',
      email: email,
      role: 'superadmin',
      companyId: platformCompanyId,
      allowed_warehouses: ['all'],
      permissions: ['full_access'],
      is_active: true,
      two_factor_enabled: false,
      phone: '',
      notes: 'System Administrator',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_by: 'system'
    };

    if (!userDocSnapshot.exists) {
      // Set creation fields
      userData.created_at = admin.firestore.FieldValue.serverTimestamp();
      userData.created_by = 'system';
      await userDocRef.set(userData);
      console.log('✅ User document created in Firestore');
    } else {
      // Update existing document (preserve created_at)
      await userDocRef.update(userData);
      console.log('✅ User document updated in Firestore');
    }

    // 4️⃣ Set custom claims (always set to ensure they're correct)
    await admin.auth().setCustomUserClaims(uid, {
      role: 'superadmin',
      admin: true
    });
    console.log('✅ Custom claims set');

    console.log('\n🎉 Superadmin created/updated successfully!\n');
    console.log('👤 Email:', email);
    console.log('🔑 UID:', uid);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    process.exit(1);
  }
}

createSuperAdmin();