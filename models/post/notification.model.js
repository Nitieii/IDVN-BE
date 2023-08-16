const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		content: String,
		contentVN: String,
		type: String,
		postId: String,
		commentId: String,
		groupId: String,
		receiverId: String,
		createdByImage: String,
		seen: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
