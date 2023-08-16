const mongoose = require("mongoose");

const noteSubSchema = new mongoose.Schema(
	{
		title: String,
		description: String,
		color: String,
		createdBy: String,
		userImg: String,
		createdByName: String,
		isDragged: {
			type: Boolean,
			default: false,
		},
		noteGlobalId: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("NoteSub", noteSubSchema);
