const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const chatRoomSchema = new mongoose.Schema(
	{
		members: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
		//   messages: [
		//     {
		//         type: Schema.Types.ObjectId,
		//         ref: "User"
		//     }
		// ],
		createBy: String,
	},
	{ timestamps: true }
);

module.exports = mongoose.model("chatRoom", chatRoomSchema);
