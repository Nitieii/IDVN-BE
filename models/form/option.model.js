const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
	{
		title: String,
		content: String,
		createBy: String,
		questionId: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Option", optionSchema);
