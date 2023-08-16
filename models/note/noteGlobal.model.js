const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const noteGlobalSchema = new mongoose.Schema(
	{
		title: {
			type: String,
		},
		createdBy: String,
		userImg: String,
		createdByName: String,
		teamMembers: Array,
		noteSubs: [
			{
				type: Schema.Types.ObjectId,
				ref: "NoteSub",
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("NoteGlobal", noteGlobalSchema);
