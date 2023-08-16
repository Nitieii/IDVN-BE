const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const questionSchema = new mongoose.Schema(
	{
		title: String,
		options: [
			{
				type: Schema.Types.ObjectId,
				ref: "Option",
			},
		],
		createBy: String,
		formId: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
