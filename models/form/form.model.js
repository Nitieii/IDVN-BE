const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const formSchema = new mongoose.Schema(
	{
		title: String,
		questions: [
			{
				type: Schema.Types.ObjectId,
				ref: "Question",
			},
		],
		createBy: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Form", formSchema);
