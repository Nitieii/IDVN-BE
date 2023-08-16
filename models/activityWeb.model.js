const mongoose = require("mongoose");

const activityWebSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		userName: {
			type: String,
			required: true,
		},
		userImg: {
			type: String,
			// required: true,
		},
		action: String,
		projectId: String,
		projectName: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("ActivityWeb", activityWebSchema);
