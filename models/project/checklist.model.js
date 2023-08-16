const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const checklistSchema = new mongoose.Schema(
	{
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		taskId: {
			type: Schema.Types.ObjectId,
			ref: "Task",
		},
		isChecked: {
			type: Boolean,
			default: false,
		},
		content: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Checklist", checklistSchema);
