const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const projectSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		filesChat: Array,
		steps: [
			{
				type: Schema.Types.ObjectId,
				ref: "Steps",
			},
		],
		history: [
			{
				type: Schema.Types.ObjectId,
				ref: "History",
			},
		],
		messages: [
			{
				type: Schema.Types.ObjectId,
				ref: "Message",
			},
		],
		numTasks: {
			type: Number,
			required: true,
			default: 0,
		},
		numFinishedTasks: {
			type: Number,
			default: 0,
		},
		numOverDeadlinesTasks: {
			type: Number,
			default: 0,
		},
		isFinished: {
			type: Boolean,
			default: false,
		},
		personCreate: {
			type: String,
			// required: true,
		},
		assignedTo: Array,
		deadline: {
			type: Date,
		},
		matterCode: String,
		matterId: String,
		backgroundColor: {
			type: String,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
