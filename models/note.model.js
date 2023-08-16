const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const noteSchema = new mongoose.Schema(
	{
		taskId: {
			type: Schema.Types.ObjectId,
			ref: "Task",
		},
		matterId: String,
		userId: {
			type: String,
			required: true,
		},
		userName: String,
		description: {
			type: String,
		},
		title: {
			type: String,
		},
		userImg: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
