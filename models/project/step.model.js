const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const StepSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			default: "New Stage",
		},
		projectId: {
			type: Schema.Types.ObjectId,
			ref: "Project",
			required: true,
		},
		tasks: [
			{
				type: Schema.Types.ObjectId,
				ref: "Task",
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Step", StepSchema);
