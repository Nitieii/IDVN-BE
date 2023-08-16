const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
	{
		projectId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Project",
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("History", historySchema);
