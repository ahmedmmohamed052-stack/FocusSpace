// server/firebaseAdmin.js
// Initializes the Firebase Admin SDK from environment variables only.
// NEVER commit the service account file — .env (gitignored) holds the
// three fields below. Only this server process can write to
// `subscriptions/*` and `users/*/payments/*` in Firestore; the client SDK
// is blocked from those paths by firestore.rules.
const admin = require("firebase-admin");

function loadCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY " +
      "in the environment. Copy them from your (rotated) Firebase service account JSON."
    );
  }

  // .env stores the private key with literal \n sequences; un-escape them.
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadCredential()),
  });
}

const db = admin.firestore();

module.exports = { admin, db };
