const mongoose = require("mongoose");

const plannedTasksSchema = new mongoose.Schema(
	{
		createdBy: String,
		createdByName: String,
		plannedHours: Number,
		week: Number,
		year: Number,
		tasks: Array,
		teamId: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("PlannedTasks", plannedTasksSchema);
