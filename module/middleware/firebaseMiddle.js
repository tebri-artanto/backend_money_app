const admin = require("firebase-admin");

const serviceAccount = require("../../money-app-3794c-firebase-adminsdk-6ows3-38bce71a82.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
