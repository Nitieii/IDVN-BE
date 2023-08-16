const mongoose = require("mongoose");

const timesheetSchema = new mongoose.Schema(
	{
		matterId: String,
		matterCode: String,
		matterName: String,
		createdById: String,
		createdBy: String,
		isEditable: {
			type: Boolean,
			default: false,
		},
		taskId: String,
		description: String,
		duration: String,
		rate: Number,
		date: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Timesheet", timesheetSchema);
