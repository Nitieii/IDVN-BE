const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		userName: {
			type: String,
			required: true,
		},
		action: String,
		subject: String,
		taskId: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
