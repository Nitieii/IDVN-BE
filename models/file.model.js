const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		path: {
			type: String,
			required: true,
		},
		sharedPerson: Array,
		createBy: {
			type: String,
			required: true,
		},
		createByName: String,
		userImg: String,
		type: String,
		Size: String,
		matterId: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("File", fileSchema);
