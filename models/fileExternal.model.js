const mongoose = require("mongoose");

const fileExternalSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			unique: true,
		},
		path: String,
		extension: String,
		fileSize: String,
		area: String,
		content: String,
		type: String,
		Size: String,
		views: {
			type: Number,
			default: 0,
		},
		downloads: {
			type: Number,
			default: 0,
		},
		badges: Array,
		language: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("FileExternal", fileExternalSchema);
