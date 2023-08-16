const firebaseAdmin = require("../notifications");

/**
 * @param {{title:String, content:String}} notification The notification Object
 * @param {String[]} tokens The firTokens array of string
 * @param {String} name Type of the notification
 * @param {String} link The link when trigger click action
 */
const sendNoti = (notification, tokens, name, link) => {
	// const message = { name, notification, tokens };
	// if (link) message.webpush = { fcmOptions: { link } };
	// firebaseAdmin
	// 	.messaging()
	// 	.sendMulticast(message)
	// 	.then((res) => {
	// 		if (res.responses[0].success) {
	// 			console.log("Successfully");
	// 		} else {
	// 			console.log(res.responses[0].error);
	// 		}
	// 	})
	// 	.catch((err) => {
	// 		console.log("Error: ", err);
	// 	});
};

module.exports = sendNoti;
