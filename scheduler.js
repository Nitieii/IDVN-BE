const cron = require("node-cron");
const moment = require("moment");
const { DateTime } = require("luxon");

const admin = require("./notifications/index");
const nodemailer = require("nodemailer");

const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

const Deadline = require("./models/deadline.model");
const User = require("./models/user.model");
const InternalNotification = require("./models/project/internalNotification.model");

const Timesheet = require("./models/matter/timesheet.model.js");

const Task = require("./models/project/task.model");

const transporter = nodemailer.createTransport({
	host: "smtp-mail.outlook.com",
	secureConnection: false, // TLS requires secureConnection to be false
	port: 587, // port for secure SMTP
	auth: {
		user: process.env.EMAIL,
		pass: process.env.PASSEMAIL,
	},
	tls: {
		ciphers: "SSLv3",
	},
});

function postProcess(users, type) {
	if (!users) {
		return [];
	}

	if (type == "users") {
		return users.map(function (user) {
			return user.fullname;
		});
	} else if (type == "id") {
		return users.map(function (user) {
			return user._id;
		});
	} else if (type == "tokens") {
		return users.reduce(function (result, user) {
			if (user.firToken) {
				result.push(user.firToken);
			}
			return result;
		}, []);
	} else if (type == "emails") {
		return users.map(function (user) {
			return user.email;
		});
	}
}

module.exports = {
	dailyReminder: () => {
		cron.schedule(
			"15 21 * * 1-4",
			async () => {
				try {
					const today = moment().format();
					const p1 = moment(today).add(1, "day").format();

					const timesheets = await Timesheet.aggregate([
						{
							$match: {
								date: {
									$gte: today,
									$lt: p1,
								},
							},
						},
						{
							$addFields: {
								TotalMinutes: {
									$add: [
										{ $toInt: { $substr: ["$duration", 3, 2] } },
										{
											$multiply: [
												{ $toInt: { $substr: ["$duration", 0, 2] } },
												60,
											],
										},
									],
								},
							},
						},
						{
							$group: {
								_id: "$createdBy",
								totalTime: { $sum: "$TotalMinutes" },
							},
						},
						{
							$match: {
								totalTime: { $lt: 240 },
							},
						},
					]);

					let registrationTokens = [];
					let emails = [];
					if (timesheets.length == 0) {
						// Send to all users
						const users = await User.find({
							$or: [{ role: "employee" }, { role: "admin" }],
						}).select({ _id: 0, fullname: 1, email: 1, firToken: 1 });

						registrationTokens = postProcess(users, "tokens");
						emails = postProcess(users, "emails");
					} else {
						// Send to user that have not write enough 8 hours
						let usernames = postProcess(timesheets, "id");
						const users = await User.find({
							$and: [
								{
									$or: [{ role: "employee" }, { role: "admin" }],
								},
								{
									fullname: { $in: usernames },
								},
							],
						}).select({ _id: 0, fullname: 1, email: 1, firToken: 1 });
						registrationTokens = postProcess(users, "tokens");
						emails = postProcess(users, "emails");
					}

					const mailOptions = {
						from: process.env.EMAIL,
						to: emails,
						subject: "Daily Timesheet Reminder",
						html: await readFile("./emails/dailyReminder.html"),
					};

					transporter.sendMail(mailOptions, function (error, info) {
						if (error) {
							console.log(error);
						} else {
							console.log("Email sent: " + info.response);
						}
					});

					// Web Push Notifications
					const message = {
						notification: {
							title: "Timesheet Reminder",
							body: "HI, don't forget to write timesheets for today. Have a good night 🥰",
						},
						data: {
							click_action: "https://www.lntinternal.com/timesheets",
						},
						tokens: registrationTokens,
					};

					admin
						.messaging()
						.sendMulticast(message)
						.then((res) => {
							if (res.responses[0].success == false) {
								console.log(res.responses[0].error);
							} else {
								console.log("Successfully");
							}
						})
						.catch((err) => {
							console.log("Error: ", err);
						});
				} catch (err) {
					console.log(err);
				}
			},
			{
				timezone: "Asia/Jakarta",
			}
		);
	},

	fridayReminder: () => {
		try {
			cron.schedule(
				"0 21 * * 5",
				async () => {
					const users = await User.find({
						$or: [{ role: "employee" }, { role: "admin" }],
					}).select({ _id: 0, fullname: 1, email: 1, firToken: 1 });

					let emails = postProcess(users, "emails");

					const mailOptions = {
						from: process.env.EMAIL,
						to: emails,
						subject: "The timesheets system will be closed soon...",
						html: await readFile("./emails/dailyReminder.html"),
					};

					transporter.sendMail(mailOptions, function (error, info) {
						if (error) {
							console.log(error);
						} else {
							console.log("Email sent: " + info.response);
						}
					});
				},
				{
					timezone: "Asia/Jakarta",
				}
			);
		} catch (err) {
			console.log(err.message);
		}
	},

	deadlineReminder: () => {
		try {
			cron.schedule(
				"0 10 * * 1-5",
				async () => {
					const today = moment().format();
					const p1 = moment(today).add(1, "day").format();

					//   query to find deadline for today only
					const deadlines = await Deadline.find({
						deadline: {
							$gte: today,
							$lt: p1,
						},
					});

					for (let i = 0; i < deadlines.length; i++) {
						// Find user to send notifications
						const user = await User.findById(deadlines[i].createdBy);

						// Format deadlines so that user can read it
						const formatedDeadline = moment(deadlines[i].deadline).format(
							"hh:mm:ss a"
						);

						// Create Internal Notifications
						const noty = await InternalNotification.create({
							content: `You have a deadline for your planned tasks: <b>${deadlines[i].task}</b> with status <b>${deadlines[i].status}</b> at <b>${formatedDeadline}</b> today`,
							createdByImage: user.image_url,
							receiverId: [deadlines[i].createdBy],
							createdAt: moment().format(),
						});

						// Push to user notifications array
						const notiOfUser = user.internalNotifications;
						notiOfUser.push(noty.id);

						const events = require("events");
						const eventEmitter = new events.EventEmitter();

						eventEmitter.emit("SendInternalNotifications", noty);

						// Send notifications through firebase
						const registrationToken = user.firToken;

						const payload = {
							notification: {
								title: "Planned Task Deadlines Reminder",
								body: `HI, Don't forget that you have a deadline for your planned tasks: <b>${deadlines[i].task}</b> with status <b>${deadlines[i].status}</b> at <b>${formatedDeadline}</b> today`,
								click_action: "https://www.lntinternal.com/plannedTasks",
							},
						};

						admin
							.messaging()
							.sendToDevice(registrationToken, payload)
							.then((res) => {
								console.log("Successfully, ", res);
							})
							.catch((err) => {
								console.log("Error: ", err);
							});
					}
				},
				{
					timezone: "Asia/Jakarta",
				}
			);
		} catch (err) {
			console.log("Error at deadline reminder cronjob: ", err.message);
		}
	},

	// Clean up deadline for this week
	deadlineRemove: () => {
		try {
			cron.schedule(
				"0 1 * * 7",
				async () => {
					await Deadline.remove();
				},
				{
					timezone: "Asia/Jakarta",
				}
			);
		} catch (err) {
			console.log("Error at deadline remove cronjob: ", err.message);
		}
	},

	updateTaskStatus: () => {
		try {
			cron.schedule("* * * * *", async () => {
				await Task.updateMany(
					{
						deadline: {
							$lte: DateTime.now().toJSDate(),
						},
						isLate: false,
					},
					{ isLate: true }
				);
			});
		} catch (err) {
			console.log("Error at update task status cronjob: ", err.message);
		}
	},
};
