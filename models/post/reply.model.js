const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
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
		replyFile: String,
		numLikes: {
			type: Number,
			required: true,
			default: 0,
		},
		likedUsers: Array,
		parentCmtId: String,
		postId: String,
		file: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Reply", replySchema);
