const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		loginTime: {
			type: Date,
			required: true,
		},
		ipAddress: {
			type: String,
			required: true,
		},
		userAgent: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			enum: ["success", "failure"],
			required: true,
		},
	},
	{ timestamps: true }
);

const LoginHistory = mongoose.model("LoginHistory", loginHistorySchema);

module.exports = LoginHistory;
