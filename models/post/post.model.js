const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const postSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			// required: true,
			// maxLength: 20
		},
		createdBy: {
			type: String,
			required: true,
		},
		createByName: String,
		userImg: String,
		upvote: Array,
		downvote: Array,
		content: {
			type: String,
			// required: true,
			// maxLength: 50
		},
		postBanner: String,
		numLikes: {
			type: Number,
			required: true,
			default: 0,
		},
		numComments: {
			type: Number,
			required: true,
			default: 0,
		},
		Comments: [
			{
				type: Schema.Types.ObjectId,
				ref: "Comment",
			},
		],
		groupID: String,
		path: Array,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
