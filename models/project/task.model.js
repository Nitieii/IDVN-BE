const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const taskSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			// required: true,
		},
		status: {
			type: String,
			default: "Not started",
		},
		isLate: {
			type: Boolean,
			default: false,
		},
		checklist: [
			{
				type: Schema.Types.ObjectId,
				ref: "Checklist",
			},
		],
		assignedTo: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
		stepId: {
			type: Schema.Types.ObjectId,
			ref: "Step",
			required: true,
		},
		projectId: {
			type: Schema.Types.ObjectId,
			ref: "Project",
			required: true,
		},
		deadline: Date,
		notes: [
			{
				type: Schema.Types.ObjectId,
				ref: "Note",
			},
		],
		timesheets: Array,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
