const mongoose = require("mongoose");

const timeOffSchema = new mongoose.Schema(
	{
		title: String,
		start: Date,
		end: Date,
		duration: Number,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("TimeOff", timeOffSchema);
