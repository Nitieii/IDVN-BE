const mongoose = require("mongoose");

const taskfileSchema = new mongoose.Schema(
	{
		taskId: {
			ref: "Task",
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		userId: {
			type: String,
			required: true,
		},
		userImg: String,
		title: {
			type: String,
			required: true,
		},
		path: {
			type: String,
			required: true,
		},
		type: String,
		Size: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("TaskFile", taskfileSchema);
