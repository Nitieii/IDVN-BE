const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
	{
		name: String,
		partner: String,
		members: Array,
		plannedTasks: Array,
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Team", teamSchema);
