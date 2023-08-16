const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const commentSchema = new mongoose.Schema(
	{
		createdBy: {
			type: String,
			required: true,
		},
		createByName: String,
		userImg: String,
		content: {
			type: String,
			// required: true,
			// maxLength: 100,
		},
		commentFile: String,
		numLikes: {
			type: Number,
			required: true,
			default: 0,
		},
		likedUsers: Array,
		PostId: String,
		reply: [
			{
				type: Schema.Types.ObjectId,
				ref: "Reply",
			},
		],
		file: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);
