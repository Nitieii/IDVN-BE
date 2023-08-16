const mongoose = require("mongoose");
var Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
	{
		fullname: {
			type: String,
		},
		email: {
			type: String,
			unique: true,
			require: true,
		},
		password: {
			type: String,
		},
		passwordLastChanged: {
			type: Date,
			default: Date.now(),
		},
		companyName: {
			type: String,
		},
		phonenumber: {
			type: String,
		},
		role: {
			type: String,
			default: "guest",
		},
		companyRole: String,
		image_url: {
			type: String,
			default:
				"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwbGozsS9QP10p16rZiCrQD0koXVkI4c7LwUHab9dkmFRcN0VqCkB37f2y0EnySItwykg&usqp=CAU",
		},
		country: String,
		province: String,
		projects: [
			{
				type: Schema.Types.ObjectId,
				ref: "Project",
			},
		],
		useCases: Array,
		verified: {
			type: Boolean,
			default: false,
		},
		tasks: [
			{
				type: Schema.Types.ObjectId,
				ref: "Task",
			},
		],
		team: {
			type: String,
			default: "",
		},
		timesheets: [
			{
				type: Schema.Types.ObjectId,
				ref: "Timesheet",
			},
		],
		matters: {
			type: Array,
			default: [],
		},
		groups: [
			{
				type: Schema.Types.ObjectId,
				ref: "Group",
			},
		],
		posts: [
			{
				type: Schema.Types.ObjectId,
				ref: "Post",
			},
		],
		firToken: [String],
		bio: String,
		billingRate: { type: Number, default: 0 },
		gender: String,
		chargePerHour: String,
		notifications: [
			{
				type: Schema.Types.ObjectId,
				ref: "Notification",
			},
		],
		backgroundColor: {
			type: String,
		},
	},
	{ timestamps: true }
);

userSchema.methods.generateVerificationToken = function () {
	const user = this;
	// const userId = user._id;
	const verificationToken = jwt.sign(
		{ id: user.id },
		process.env.ACCESS_TOKEN_SECRET
	);
	return verificationToken;
};

userSchema.index({ email: 1 }, { unique: true });

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
