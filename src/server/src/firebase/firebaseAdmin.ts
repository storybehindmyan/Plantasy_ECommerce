// server/src/firebaseAdmin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // or use serviceAccount + databaseURL if needed
  });
}

export { admin };
