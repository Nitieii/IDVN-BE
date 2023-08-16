const mongoose = require("mongoose");

const newSchema = new mongoose.Schema(
	{
		title: String,
		banner_url: String,
		html: String,
		createdBy: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("New", newSchema);
