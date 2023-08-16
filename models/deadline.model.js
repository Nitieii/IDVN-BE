const mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema(
	{
		createdBy: String,
		task: String,
		deadline: String,
		status: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Deadline", deadlineSchema);
