const User = require("../models/user.model");
const Notification = require("../models/post/notification.model");
const InternalNotification = require("../models/project/internalNotification.model");
const Team = require("../models/team.model");
const Task = require("../models/project/task.model");
const Project = require("../models/project/project.model");

const Timesheet = require("../models/matter/timesheet.model");
const PlannedTask = require("../models/plannedTasks/plannedTask.model");
const { catchAsync } = require("#utils");

const argon2 = require("argon2");
const nodemailer = require("nodemailer");
const moment = require("moment");
const mongoose = require("mongoose");

const excelToJson = require("convert-excel-to-json");

const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
// const client = redis.createClient(REDIS_PORT);

const transporter = nodemailer.createTransport({
	service: "Gmail",
	auth: {
		user: process.env.EMAIL,
		pass: process.env.PASSEMAIL,
	},
});

function paginate(array, page_size, page_number) {
	// human-readable page numbers usually start with 1, so we reduce 1 in the first argument
	return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const CRUDuserCtrl = {
	getUsers: async (req, res) => {
		const userArray = [];
		if (req.user.role !== "guest") {
			try {
				const users = await User.find();
				for (let i = 0; i < users.length; i++) {
					const user = {
						fullname: users[i].fullname,
						email: users[i].email,
						companyName: users[i].companyName,
						phonenumber: users[i].phonenumber,
						role: users[i].role,
						image_url: users[i].image_url,
						country: users[i].country,
						province: users[i].province,
						projects: users[i].projects,
						useCases: users[i].useCases,
						tasks: users[i].tasks,
						createdAt: users[i].createdAt,
					};
					userArray.push(user);
				}
				return res.send({ status: "success", users: userArray });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		} else {
			console.log("Account does not have this permission");
			return res.send({
				status: "error",
				message: "Account does not have this permission",
			});
		}
	},

	getUsersById: async (req, res) => {
		if (req.user.role !== "guest") {
			try {
				const users = await User.findById(req.params.id);
				const user = {
					fullname: users.fullname,
					email: users.email,
					companyName: users.companyName,
					phonenumber: users.phonenumber,
					role: users.role,
					image_url: users.image_url,
					country: users.country,
					province: users.province,
					projects: users.projects,
					useCases: users.useCases,
					tasks: users.tasks,
					createdAt: users.createdAt,
				};
				return res.send({ status: "success", user: user });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		} else {
			console.log("Account does not have this permission");
			return res.send({
				status: "error",
				message: "Account does not have this permission",
			});
		}
	},

	cleanDuplicateFirToken: async (req, res) => {
		try {
			const users = await User.find();

			for (let i = 0; i < users.length; i++) {
				if (typeof users[i].team !== "string") {
					users[i].team = new String("");
				}

				if (users[i].firToken.length > 1) {
					const firToken = users[i].firToken;
					const firTokenSet = new Set(firToken);
					const firTokenArray = [...firTokenSet];
					users[i].firToken = firTokenArray;
					await users[i].save();
				}
			}
			return res.send({ status: "success", message: "Cleaned" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getUserEmployee: async (req, res) => {
		try {
			if (
				req.user.role == "admin" ||
				req.user.role == "employee" ||
				req.user.role == "partner"
			) {
				const usersEmployee = await User.find({
					$or: [{ role: "employee" }, { role: "partner" }, { role: "admin" }],
				})
					.select({
						id: 1,
						fullname: 1,
						email: 1,
						phonenumber: 1,
						backgroundColor: 1,
						image_url: 1,
						country: 1,
						province: 1,
						role: 1,
						createdAt: 1,
					})
					.sort({ createdAt: -1 });

				return res.send({
					status: "success",
					user: usersEmployee,
				});
			} else {
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getUserClient: async (req, res) => {
		try {
			if (req.user.role == "admin" || req.user.role == "partner") {
				const clients = await User.find({ role: "client" })
					.sort({
						createdAt: -1,
					})
					.select({
						id: 1,
						fullname: 1,
						email: 1,
						companyName: 1,
						phonenumber: 1,
						country: 1,
						province: 1,
						createdAt: 1,
					});

				return res.send({ status: "success", users: clients });
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getUserPartner: async (req, res) => {
		try {
			if (req.user.role !== "guest" && req.user.role != "client") {
				const users = await User.find();
				const usersArr = [];
				for (let i = 0; i < users.length; i++) {
					if (users[i].role == "partner" || users[i].role == "admin") {
						const result = {
							fullname: users[i].fullname,
							email: users[i].email,
							companyName: users[i].companyName,
							phonenumber: users[i].phonenumber,
							role: users[i].role,
							image_url: users[i].image_url,
							country: users[i].country,
							province: users[i].province,
							projects: users[i].projects,
							useCases: users[i].useCases,
							tasks: users[i].tasks,
							createdAt: users[i].createdAt,
						};
						usersArr.push(result);
					}
				}

				return res.send({ status: "success", users: usersArr });
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getAssignedToMe: async (req, res) => {
		try {
			let tasks = await Task.aggregate([
				{
					$group: {
						_id: {
							status: "$status",
						},
						tasks: {
							$push: {
								$cond: [
									{
										$in: [mongoose.Types.ObjectId(req.user.id), "$assignedTo"],
									},
									{
										_id: "$_id",
										title: "$title",
										assignedTo: "$assignedTo",
										isLate: "$isLate",
									},
									"$$REMOVE",
								],
							},
						},
					},
				},
				{
					$project: {
						title: "$_id.status",
						cards: "$tasks",
						_id: 0,
					},
				},
			]);

			return res.send({ status: "success", results: tasks });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addEmployee: async (req, res) => {
		if (req.user.role == "admin") {
			try {
				const { fullname, email, password: plainTextPassword, role } = req.body;
				const password = await argon2.hash(plainTextPassword);

				const checkUser = await User.findOne({ email });
				if (checkUser) {
					return res.send({
						status: "error",
						message: "Email is already in use",
					});
				}

				const user = await User.create({
					fullname,
					email,
					password,
					role,
					verified: true,
					createdAt: moment().format(),
				});
				user.save();

				return res.send({
					status: "success",
					message: "Employee created successfully",
					user: user,
				});
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		} else {
			return res.send({
				status: "error",
				message: "User does not have this permission",
			});
		}
	},

	getUserOfTeam: async (req, res) => {
		try {
			if (req.user.role !== "guest" || req.user.role !== "client") {
				const partner = await User.findById(req.params.idpartner);
				const teamOfPartner = partner.team;
				const usersArr = [];
				for (let i = 0; i < teamOfPartner.length; i++) {
					const member = await User.findById(teamOfPartner[i]);
					const result = {
						fullname: member.fullname,
						email: member.email,
						companyName: member.companyName,
						phonenumber: member.phonenumber,
						role: member.role,
						image_url: member.image_url,
						country: member.country,
						province: member.province,
						projects: member.projects,
						useCases: member.useCases,
						tasks: member.tasks,
						createdAt: member.createdAt,
					};
					usersArr.push(result);
				}
				return res.send({ status: "success", users: usersArr });
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchClient: async (req, res) => {
		try {
			if (req.user.role !== "guest") {
				let q = req.body.query;
				let query = {
					$or: [
						{ companyName: { $regex: `${q}`, $options: "i" } },
						{ fullname: { $regex: `${q}`, $options: "i" } },
						{ email: { $regex: `${q}`, $options: "i" } },
					],
				};
				let output = [];
				if (req.body.query === "") {
					const user = await User.find();
					const userArr = [];
					for (let i = 0; i < user.length; i++) {
						if (user[i].role === "client") {
							userArr.push(user[i]);
						}
					}
					return res.send({ status: "success", users: userArr });
				} else {
					User.find(query)
						.limit(6)
						.then((users) => {
							if (users && users.length && users.length > 0) {
								users.forEach((user) => {
									if (user.role === "client") {
										let obj = {
											fullname: user.fullname,
											email: user.email,
											companyName: user.companyName,
											phonenumber: user.phonenumber,
											role: user.role,
											image_url: user.image_url,
											country: user.country,
											province: user.province,
											projects: user.projects,
											useCases: user.useCases,
											tasks: user.tasks,
											createdAt: user.createdAt,
										};
										output.push(obj);
									}
								});
							}
							return res.send({ status: "success", users: output });
						});
				}
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchEmployee: async (req, res) => {
		try {
			if (req.user.role !== "guest" && req.user.role !== "client") {
				let q = req.body.query;
				let query = {
					$or: [
						{ fullname: { $regex: `${q}`, $options: "i" } },
						{ email: { $regex: `${q}`, $options: "i" } },
					],
				};
				let output = [];
				if (req.body.query === "") {
					const user = await User.find();
					const userArr = [];
					for (let i = 0; i < user.length; i++) {
						if (user[i].role !== "client" && user[i].role !== "guest") {
							userArr.push(user[i]);
						}
					}
					return res.send({ status: "success", users: userArr });
				} else {
					User.find(query)
						.limit(6)
						.then((users) => {
							if (users && users.length && users.length > 0) {
								users.forEach((user) => {
									if (user.role === "employee") {
										let obj = {
											fullname: user.fullname,
											email: user.email,
											companyName: user.companyName,
											phonenumber: user.phonenumber,
											role: user.role,
											image_url: user.image_url,
											country: user.country,
											province: user.province,
											projects: user.projects,
											useCases: user.useCases,
											tasks: user.tasks,
											createdAt: user.createdAt,
										};
										output.push(obj);
									}
								});
							}
							return res.send({ status: "success", users: output });
						});
				}
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchPartner: async (req, res) => {
		try {
			if (req.user.role !== "guest") {
				let q = req.body.query;
				let query = {
					$or: [{ fullname: { $regex: `${q}`, $options: "i" } }],
				};
				let output = [];
				if (req.body.query === "") {
					const user = await User.find();
					const userArr = [];
					for (let i = 0; i < user.length; i++) {
						if (user[i].role === "partner") {
							userArr.push(user[i]);
						}
					}
					return res.send({ status: "success", users: userArr });
				} else {
					User.find(query)
						.limit(6)
						.then((users) => {
							if (users && users.length && users.length > 0) {
								users.forEach((user) => {
									if (user.role === "partner") {
										let obj = {
											fullname: user.fullname,
											email: user.email,
											companyName: user.companyName,
											phonenumber: user.phonenumber,
											role: user.role,
											image_url: user.image_url,
											country: user.country,
											province: user.province,
											projects: user.projects,
											useCases: user.useCases,
											tasks: user.tasks,
											createdAt: user.createdAt,
										};
										output.push(obj);
									}
								});
							}
							return res.send({ status: "success", users: output });
						});
				}
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateUSers: async (req, res) => {
		if (req.user.id === req.params.id || req.user.role == "admin") {
			try {
				const user = await User.findById(req.params.id);
				if (req.body.fullname) {
					user.fullname = req.body.fullname;

					await Timesheet.updateMany(
						{ createdById: req.params.id },
						{ $set: { createdBy: req.body.fullname } }
					);

					await PlannedTask.updateMany(
						{ createdBy: req.params.id },
						{ $set: { createdByName: req.body.fullname } }
					);
				}

				if (req.body.bio) {
					user.bio = req.body.bio;
				}
				if (req.body.password) {
					const { password: plainTextPassword } = req.body;

					const password = await argon2.hash(plainTextPassword);
					user.password = password;
				}

				if (req.body.email || req.body.email == "") {
					user.email = req.body.email;
				}
				if (req.body.companyName || req.body.companyName == "") {
					user.companyName = req.body.companyName;
				}
				if (req.body.phonenumber || req.body.phonenumber == "") {
					user.phonenumber = req.body.phonenumber;
				}
				if (req.body.role) {
					user.role = req.body.role;
				}
				if (req.body.country || req.body.country == "") {
					user.country = req.body.country;
				}
				if (req.body.province || req.body.province == "") {
					user.province = req.body.province;
				}
				if (req.body.team) {
					user.team = req.body.team;
				}

				if (req.body.billingRate) {
					user.billingRate = req.body.billingRate;
				}

				user.save();

				return res.send({
					status: "success",
					message: "update success",
					user: user,
				});
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		}
	},

	firTokenPost: catchAsync(async (req, res) => {
		await User.findByIdAndUpdate(req.user.id, {
			$addToSet: { firToken: req.body.firToken },
		});

		return res.send({ status: "success" });
	}),

	importUsers: async (req, res) => {
		if (req.user.role == "admin") {
			try {
				const result = excelToJson({
					sourceFile: req.file.path,
					header: { rows: 1 },
					columnToKey: {
						A: "fullname",
						B: "email",
						C: "role",
						D: "gender",
						E: "team",
					},
				});

				for (let i = 0; i < result.Sheet1.length; i++) {
					const checkUser = await User.findOne({
						email: result.Sheet1[i].email,
					});

					// If user exist skip creating that user
					if (checkUser) {
						continue;
					}

					// Check if team exist if the request send
					// let checkTeam = "";
					// if (result.Sheet1[i].team) {
					//   const checkedTeam = await Team.findOne({
					//     name: result.Sheet1[i].team,
					//   }).select({ id: 1, members: 1 });

					//   if (!checkTeam) {
					//     return res.send({
					//       status: "error",
					//       message: `Team with name: ${result.Sheet1[i].team} does not exist. Please check again.`,
					//     });
					//   }

					//   // Add user to team members
					//   checkTeam = checkedTeam;
					// }
					const plainTextPassword = "lntpartners123@";
					const password = await argon2.hash(plainTextPassword);

					// Create new user
					const newUser = await User.create({
						fullname: result.Sheet1[i].fullname,
						email: result.Sheet1[i].email,
						password: password,
						verified: true,
						role: result.Sheet1[i].role.toLowerCase(),
						gender: result.Sheet1[i].gender.toLowerCase(),
					});

					newUser.save();
				}

				await unlinkFile(req.file.path);

				return res.send({ status: "success", message: "success" });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		} else {
			return res.send({
				status: "error",
				message: "User does not have the permission",
			});
		}
	},

	updateAvatar: async (req, res) => {
		const { upload_img_user } = require("./upload_img_user");
		let user_img_url = "";

		const file = req.file;
		const result = await upload_img_user(file);
		await unlinkFile(file.path);
		user_img_url = result.Location;

		const user = await User.findById(req.user.id);
		user.image_url = user_img_url;
		user.save();

		return res.send({
			status: "success",
			message: "Updated successfully",
			image_url: user.image_url,
		});
	},

	getNotificationsByUserId: async (req, res) => {
		try {
			const user = await User.findById(req.user.id);

			// Get id noty arr by user id
			const notificationsId = user.notifications;

			// Find Noty and push to array
			const notificationsArr = [];
			let page = req.query.page;

			const result = paginate(notificationsId.reverse(), 10, page);
			const totalPage = parseInt((notificationsId.length + 10 - 1) / 10);

			for (let i = 0; i < result.length; i++) {
				const noty = await Notification.findById(result[i]);
				notificationsArr.push(noty);
			}

			return res.send({
				status: "success",
				noties: notificationsArr,
				totalPage: totalPage,
				length: notificationsId.length,
			});

			// Return
		} catch (err) {
			return res.send({
				status: "error",
				message: err.message,
			});
		}
	},

	getInternalNotificationsByUserId: async (req, res) => {
		try {
			let user = await User.aggregate()
				.match({ _id: new mongoose.Types.ObjectId(req.user.id) })
				.lookup({
					from: "internalnotifications",
					localField: "_id",
					foreignField: "receiverId",
					as: "internalNotifications",
				});
			user = user[0];

			// Get id noty arr by user id
			const notificationsId = user.internalNotifications;

			// Find Noty and push to array
			const notificationsArr = [];
			let page = req.query.page;

			const result = paginate(notificationsId.reverse(), 4, page);
			const totalPage = parseInt((notificationsId.length + 4 - 1) / 4);

			for (let i = 0; i < result.length; i++) {
				const noty = await InternalNotification.findById(result[i]);
				notificationsArr.push(noty);
			}

			return res.send({
				status: "success",
				noties: notificationsArr,
				totalPage: totalPage,
				length: notificationsId.length,
			});

			// Return
		} catch (err) {
			return res.send({
				status: "error",
				message: err.message,
			});
		}
	},

	updateNotySeen: async (req, res) => {
		try {
			const noty = await Notification.findById(req.params.idNoty);
			console.log(noty);
			noty.seen = true;
			noty.save();

			return res.send({
				status: "success",
				message: "Update notification seen successfully",
			});
		} catch (err) {
			return res.send({
				status: "error",
				message: err.message,
			});
		}
	},

	updateInternalNotySeen: async (req, res) => {
		try {
			const noty = await InternalNotification.findById(req.params.idNoty);
			console.log(noty);
			noty.seen = true;
			noty.save();

			return res.send({
				status: "success",
				message: "Update notification seen successfully",
			});
		} catch (err) {
			return res.send({
				status: "error",
				message: err.message,
			});
		}
	},

	ConfirmResetPassword: async (req, res) => {
		try {
			const url = `https://dlswahe1x7uoe.cloudfront.net/api/users/resetpassword`;
			transporter.sendMail({
				to: req.body.email,
				subject: "Verify Account",
				html: `Click <a href = '${url}'>here</a> to reset your password.`,
			});
			return res.send({
				status: "success",
				message: `Sent a email to ${req.body.email}. Please check it!`,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	ResetPassword: async (req, res) => {
		try {
			const email = req.body.email;
			if (req.user.role == "admin" || req.user.email == email) {
				const { newpassword: plainTextPassword } = req.body;
				const newpassword = await argon2.hash(plainTextPassword);
				const user = User.findOne({ email });
				user.password = newpassword;

				user.save();
				return res.send({
					status: "success",
					message: "Reset password successfully",
				});
			} else {
				return res.send({
					status: "error",
					message: "User does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteUsers: async (req, res) => {
		if (req.user.role === "admin") {
			try {
				const user = await User.findByIdAndDelete(req.params.id);

				await Team.findByIdAndUpdate(
					{ _id: user.team },
					{ $pull: { users: user._id } }
				);

				await Project.updateMany(
					{ _id: { $in: user.projects } },
					{ $pull: { members: user._id } }
				);

				await Task.updateMany(
					{
						_id: { $in: user.tasks },
					},
					{ $pull: { assignedTo: user._id } }
				);

				return res.send({ status: "success", message: "User deleted." });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		} else {
			return res.send({
				status: "error",
				message: "Account does not have this permission",
			});
		}
	},

	checkIfThePasswordExpired: async (req, res) => {
		try {
			// Get the user;s lassPasswordChange
			const user = await User.findOne({ _id: req.user.id });

			if (!user) {
				return res.send({ status: "error", message: "User does not  exists" });
			}

			// Get the current date
			const currentDate = new Date();

			if (!user.passwordLastChanged) {
				return res.send({
					status: "error",
					message: "You must change your password",
				});
			}

			// Get the last password change date
			const lastPasswordChange = new Date(user.passwordLastChanged);

			// Get the difference in days
			const differenceInTime =
				currentDate.getTime() - lastPasswordChange.getTime();
			const differenceInDays = differenceInTime / (1000 * 3600 * 24);

			// If the difference is greater than 30 days, return an error
			if (differenceInDays > 30) {
				return res.send({
					status: "error",
					message: "You must change your password",
				});
			}

			return res.send({ status: "success" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	changePassword: async (req, res) => {
		try {
			const { oldPassword, newPassword } = req.body;

			// Check if either oldPassword and newPassword are empty
			if (!oldPassword || !newPassword) {
				return res.send({
					status: "error",
					message: "Please provide both old and new passwords",
				});
			}

			// Check if the new password is the same as the old password
			if (oldPassword === newPassword) {
				return res.send({
					status: "error",
					message: "New password cannot be the same as the old password",
				});
			}

			// Get the user's password
			const user = await User.findOne({ _id: req.user.id });
			const oldpassword = user.password;

			// Check if the old password is correct
			const isPasswordCorrect = await argon2.verify(oldpassword, oldPassword);

			if (!isPasswordCorrect) {
				return res.send({
					status: "error",
					message: "Old password is incorrect",
				});
			}

			// Hash the new password
			const hashedPassword = await argon2.hash(newPassword);

			// Update the user's password
			user.password = hashedPassword;
			user.passwordLastChanged = new Date();
			await user.save();

			return res.send({
				status: "success",
				message: "Password changed successfully",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = CRUDuserCtrl;
