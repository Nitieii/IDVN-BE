const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
	{
		content: String,
		path: Array,
		sentById: String,
		sentBy: String,
		projectId: String,
		SenderImg: String,
		typefile: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
