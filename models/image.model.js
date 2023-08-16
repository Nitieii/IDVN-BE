const mongoose = require("mongoose");

const ImgSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		path: {
			type: String,
			required: true,
		},
		groupId: String,
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Image", ImgSchema);
