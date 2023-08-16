const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const matterSchema = new mongoose.Schema(
	{
		matterCode: String,
		matterName: String,
		client: String,
		followers: Array,
		assignedTo: String,
		contactEmail: String,
		matterType: String,
		description: String,
		status: {
			type: String,
			default: "Open",
		},
		notes: [
			{
				type: Schema.Types.ObjectId,
				ref: "Note",
			},
		],
		deadline: Date,
		timesheet: Array,
		totalWorkingHours: Number,
		initialPLannedHours: Number,
		createdBy: String,
		createdByImg: String,
		// notes: Array,
		document: [
			{
				type: Schema.Types.ObjectId,
				ref: "File",
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Matter", matterSchema);
