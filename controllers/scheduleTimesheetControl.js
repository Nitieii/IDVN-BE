const User = require("../models/user.model");
const Timesheet = require("../models/matter/timesheet.model");
const InternalNotification = require("../models/project/internalNotification.model");
const moment = require("moment");
const nodemailer = require("nodemailer");

// get current moment
const today = moment();
// convert to string
const a = today.format();
const scheduleCtrl = {
	active: async (req, res) => {
		const users = await User.find({
			$or: [{ role: "admin" }, { role: "employee" }],
		});

		var curr = new Date(); // get current date
		var first = curr.getDate() - curr.getDay() + 1; // First day is the day of the month - the day of the week
		var last = first + 6; // last day is the first day + 6

		var firstday = new Date(curr.setDate(first)).toISOString();
		var lastday = new Date(curr.setDate(last)).toISOString();

		let unfinishedUsers = [];

		for (let i = 0; i < users.length; i++) {
			const timesheets = await Timesheet.find({
				$and: [
					{
						createdById: users[i].id,
					},
					{
						createdAt: {
							$gte: firstday,
							$lt: lastday,
						},
					},
				],
			});

			if (!timesheets) {
				unfinishedUsers.push(users[i].id);
				const transporter = nodemailer.createTransport({
					service: "gmail",
					auth: {
						user: process.env.EMAIL,
						pass: process.env.PASSEMAIL,
					},
				});

				const mailOptions = {
					from: process.env.EMAIL,
					to: users[i].email,
					subject: "Reminder",
					text: "You need to create timesheet for this week!",
				};

				transporter.sendMail(mailOptions, function (error, info) {
					if (error) {
						console.log(error);
						return res.send({ status: "error", message: error.message });
					} else {
						console.log("Email sent: " + info.response);
						return res.send({
							status: "success",
							message: "Sent email successfully",
						});
					}
				});
			}
		}

		const noty = await InternalNotification.create({
			content: `You need to create timesheet for this week!`,
			receiverId: unfinishedUsers,
			createdAt: moment().format(),
		});
		noty.save();

		req.emit("SendInternalNotifications", noty);
	},

	checkagain: async (req, res) => {
		const userArr = [];
		const checkArr = [];
		const users = await User.find();
		for (let i = 0; i < users.length; i++) {
			if (users[i].role === "admin" || users[i].role === "employee") {
				const timesheetOfUser = users[i].timesheets;
				if (timesheetOfUser.length === 0) {
					userArr.push(users[i].fullname);
				} else {
					for (let j = 0; j < timesheetOfUser.length; j++) {
						const timesheet = await Timesheet.findById(timesheetOfUser[j]);
						// get Monday from Sunday
						var k = moment().day(-6).format();
						// check createAt of timesheet is between Monday to Sunday?
						var bool = moment(timesheet.createdAt).isBetween(k, a);
						checkArr.push(bool);
					}
					// Check true in array?
					// if true not in checkArr
					if (checkArr.indexOf("true") !== -1) {
						userArr.push(users[i].fullname);
					}
				}
			}
		}

		const contentEmail = userArr.map((user) => {
			return `<li>${user}</li>`;
		});

		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL,
				pass: process.env.PASSEMAIL,
			},
		});
		const mailOptions = {
			from: process.env.EMAIL,
			to: "camtu29082000@gmail.com",
			subject:
				"List of employees who have not created a timesheet for this week",
			html: `<ol>${contentEmail}</ol>`,
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {
				console.log(error);
				return res.send({ status: "error", message: error.message });
			} else {
				console.log("Email sent: " + info.response);
				return res.send({ status: "success", message: "sent email success" });
			}
		});
	},
};

module.exports = scheduleCtrl;
