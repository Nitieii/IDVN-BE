const mongoose = require("mongoose");

const internalNotificationSchema = new mongoose.Schema(
	{
		content: String,
		type: String,
		receiverId: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		projectId: String,
		createdByImage: String,
		seen: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model(
	"InternalNotification",
	internalNotificationSchema
);
