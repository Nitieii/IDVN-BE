var admin = require("firebase-admin");

var serviceAccount = require("./lnt-internal-firebase-adminsdk-iueq1-6baddfd6b5.json");

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
