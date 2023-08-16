const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const groupSchema = new mongoose.Schema(
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
		description: String,
		numMembers: {
			type: Number,
			required: true,
			default: 0,
		},
		posts: [
			{
				type: Schema.Types.ObjectId,
				ref: "Post",
			},
		],
		members: [],
		ImgUrl: {
			type: String,
			default:
				"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwbGozsS9QP10p16rZiCrQD0koXVkI4c7LwUHab9dkmFRcN0VqCkB37f2y0EnySItwykg&usqp=CAU",
		},
		rules: {
			type: Array,
			default: [
				"Stay on topic.",
				"Limit self-promotion.",
				"Personal Attacks.",
				"Keep headlines objective.",
				"No soapboxing.",
				"No Spam",
			],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
