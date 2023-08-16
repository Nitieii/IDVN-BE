const Matter = require("../../models/matter/matter.model");
const Timesheet = require("../../models/matter/timesheet.model");
const User = require("../../models/user.model");
const Task = require("../../models/project/task.model");
const Project = require("../../models/project/project.model");
const Step = require("../../models/project/step.model");

const moment = require("moment");

const nodemailer = require("nodemailer");

const excelToJson = require("convert-excel-to-json");

const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const CRUDmatterCtrl = {
	getMatter: async (req, res) => {
		try {
			if (req.user.role === "admin") {
				const matter = await Matter.find().sort({ createdAt: -1 });
				return res.send({ status: "success", matter: matter });
			} else if (req.user.role == "partner" || req.user.role == "employee") {
				const user = await User.findById(req.user._id);

				const matters = user.matters;

				const matter = await Matter.find({ _id: { $in: matters } }).sort({
					createdAt: -1,
				});

				return res.send({ status: "success", matter: matter });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getMatterFollowers: async (req, res) => {
		try {
			if (req.user.role === "admin" || req.user.role == "partner") {
				const matter = await Matter.findById(req.params.id);

				const followers = matter.followers;

				const users = await User.find({ _id: { $in: followers } }).select({
					id: 1,
					fullname: 1,
					email: 1,
				});

				return res.send({
					status: "success",
					followers: users,
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

	getMatterCode: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				const matter = await Matter.find().sort({ createdAt: -1 });
				const matterCodeArr = [];
				for (let i = 0; i < matter.length; i++) {
					matterCodeArr.push(matter[i].matterCode);
				}
				return res.send({ status: "success", matterCode: matterCodeArr });
			} else if (req.user.role == "employee" || req.user.role == "partner") {
				const user = await User.findById(req.user.id);

				const userMatters = user.matters;

				const matter = await Matter.find({ _id: { $in: userMatters } }).sort({
					createdAt: -1,
				});

				const matterCodeArr = [];
				for (let i = 0; i < matter.length; i++) {
					matterCodeArr.push(matter[i].matterCode);
				}

				return res.send({ status: "success", matterCode: matterCodeArr });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getMatterName: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				const matter = await Matter.find().sort({ createdAt: -1 });
				const matterNameArr = [];
				for (let i = 0; i < matter.length; i++) {
					matterNameArr.push(matter[i].matterName);
				}
				return res.send({ status: "success", matterName: matterNameArr });
			} else if (req.user.role == "partner" || req.user.role == "employee") {
				const user = await User.findById(req.user.id);

				const userMatters = user.matters;

				const matter = await Matter.find({ _id: { $in: userMatters } }).sort({
					createdAt: -1,
				});

				const matterNameArr = [];
				for (let i = 0; i < matter.length; i++) {
					matterNameArr.push(matter[i].matterName);
				}

				return res.send({ status: "success", matterName: matterNameArr });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getUserMatters: async (req, res) => {
		try {
			// Get user's matters array
			const user = await User.findById(req.user.id);
			let matters = [];

			const mattersOfUserIds = user.matters;

			// Query matters infor
			matters = await Matter.find({
				_id: { $in: mattersOfUserIds },
			})
				.select({
					id: 1,
					matterName: 1,
					matterCode: 1,
				})
				.sort({ createdAt: -1 });

			return res.send({ status: "success", matters: matters });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getUserMatterAnalysis: async (req, res) => {
		if (
			req.user.role == "admin" ||
			req.user.role == "employee" ||
			req.user.role == "partner"
		) {
			try {
				// Get the request body date range
				const { date1, date2, type } = req.body;

				let dateStart;
				let dateEnd;

				const currentDate = new Date();
				// Handle date range

				if (type) {
					if (type == "This Week") {
						// Calculate first and last date of current week
						const firstDate = currentDate.getDate() - currentDate.getDay();
						const lastDate = firstDate + 6;

						dateStart = moment(currentDate.setDate(firstDate)).format();
						dateEnd = moment(currentDate.setDate(lastDate)).format();
					} else if (type == "This Month") {
						// Calculate first and last date of current month
						const y = currentDate.getFullYear(),
							m = currentDate.getMonth();

						dateStart = moment(new Date(y, m, 1)).format();
						dateEnd = moment(new Date(y, m + 1, 0)).format();
					} else if (type == "This Year") {
						dateStart = moment(
							new Date(currentDate.getFullYear(), 0, 1)
						).format();
						dateEnd = moment(
							new Date(currentDate.getFullYear(), 11, 31)
						).format();
					}
				} else {
					dateStart = moment(date1).format();
					dateEnd = moment(date2).format();
				}

				const timesheetMatters = await Timesheet.find({
					$and: [
						{ createdById: req.user.id },
						{
							date: {
								$gte: dateStart,
								$lte: dateEnd,
							},
						},
					],
				}).sort({ createdAt: -1 });

				const typesOfMatter = ["Potential Matters", "BD & PR", "KM"];
				// Get all the matters that user wrote during this time
				for (let l = 0; l < timesheetMatters.length; l++) {
					if (!typesOfMatter.includes(timesheetMatters[l].matterName)) {
						typesOfMatter.push(timesheetMatters[l].matterName);
					}
				}

				let results = [];

				for (let i = 0; i < typesOfMatter.length; i++) {
					const searchQuery = [
						{ createdById: req.user.id },
						{ matterName: typesOfMatter[i] },
						{
							date: {
								$gte: dateStart,
								$lte: dateEnd,
							},
						},
					];

					const result = await Timesheet.aggregate([
						{
							$match: {
								$and: searchQuery,
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
								_id: typesOfMatter[i],
								totalTime: { $sum: "$TotalMinutes" },
							},
						},
						{
							$project: {
								_id: 0,
								matterName: "$_id",
								totalTime: {
									$add: [
										{ $toInt: { $divide: ["$totalTime", 60] } },
										{ $divide: [{ $mod: ["$totalTime", 60] }, 100] },
									],
								},
							},
						},
					]);

					if (result[0]) {
						results.push(result[0]);
					} else {
						const obj = {
							matterName: typesOfMatter[i],
							totalTime: 0,
						};
						results.push(obj);
					}
				}

				return res.send({ status: "success", result: results });
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

	search: async (req, res) => {
		try {
			let q = req.body.query;
			let matters = [];

			let query = {
				$or: [
					{ matterCode: { $regex: `${q}`, $options: "i" } },
					{ matterName: { $regex: `${q}`, $options: "i" } },
				],
			};

			if (req.body.query === "") {
				matters = Matter.find().sort({ createdAt: -1 });
			} else {
				matters = Matter.find(query).sort({ createdAt: -1 });
			}

			return res.send({ status: "success", matters: matters });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addMatter: async (req, res) => {
		function getRandomNum(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}
		try {
			if (req.user.role !== "admin") {
				res.send({
					status: "error",
					message: "Account does not have the permission",
				});
			}

			const {
				followers,
				matterName,
				client,
				contactEmail,
				matterType,
				description,
				assignedTo,
			} = req.body;

			const existedMatter = await Matter.findOne({ matterName });

			if (existedMatter) {
				return res.send({ status: "error", message: "Matter already exists" });
			}

			const user = await User.findOne({
				role: "partner",
				fullname: assignedTo,
			});
			const mattersArrOfUser = user.matters;

			let name = assignedTo;
			let acronym = name
				.split(/\s/)
				.reduce((response, word) => (response += word.slice(0, 1)), "");

			const currentYear = new Date().getFullYear();

			const mattersOfUserLength = mattersArrOfUser.length;
			const newMatterCode =
				"EL" +
				"_" +
				currentYear +
				"_" +
				acronym +
				"_" +
				mattersOfUserLength.toString();

			const matterCreate = await Matter.create({
				matterCode: newMatterCode,
				matterName,
				contactEmail,
				matterType,
				description,
				assignedTo,
				client,
				followers,
				createdBy: req.user.name,
				createdByImg: req.user.image_url,
				createdAt: moment().format(),
			});
			matterCreate.save();

			mattersArrOfUser.push(matterCreate.id);
			user.save();

			// Add matter id to user array
			await User.updateMany(
				{ _id: { $in: followers } },
				{ $push: { matters: matterCreate.id } }
			);

			const colors = [
				"#588B8B",
				"#FFD5C2",
				"#F28F3B",
				"#CA3636",
				"#2d3047",
				"#00579d",
				"#d37764",
				"#5d7a48",
				"#f0bc3a",
				"#bd9c7f",
				"#94986c",
				"#b897bb",
			];

			const chosenColor = colors[getRandomNum(0, colors.length - 1)];

			// Create a project
			const projectCreate = await Project.create({
				title: matterName,
				assignedTo: followers,
				matterCode: newMatterCode,
				matterId: matterCreate.id,
				backgroundColor: chosenColor,
				personCreate: req.user.id,
			});

			const defaultStepsTitle = ["Step 1", "Step 2", "Step 3"];
			const defaultSteps = [];

			defaultStepsTitle.map(async (title) => {
				const newStep = await Step.create({
					title: title,
					projectId: projectCreate.id,
				});
				newStep.save();

				defaultSteps.push(newStep);
			});

			projectCreate.steps = defaultSteps;
			projectCreate.save();

			return res.send({ status: "success", matters: matterCreate });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchAdverseParty: async (req, res) => {
		try {
			const q = req.body.query;

			const matters = await Matter.find({
				matterName: { $regex: `${q}`, $options: "i" },
				status: "Open",
			})
				.sort({ createdAt: -1 })
				.select({
					id: 1,
					matterName: 1,
					matterCode: 1,
					assignedTo: 1,
					client: 1,
				});

			return res.send({ status: "success", adverseParty: matters });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	sendClearConflictReq: async (req, res) => {
		try {
			const matter = await Matter.findById(req.body.idmatter);

			const transporter = nodemailer.createTransport({
				host: "smtp-mail.outlook.com",
				secureConnection: false,
				port: 587,
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSEMAIL,
				},
				tls: {
					ciphers: "SSLv3",
				},
			});

			transporter.sendMail({
				to: "tuananhngo2513@gmail.com",
				subject: "Resolve Matter Conflict",
				html: `${req.user.fullname} is opening matter: <b>${req.body.newMatterName} and has found a conflicted matter <b>${matter.matterName}</b> (matterCode: ${matter.matterCode}), that you are in charge. Please resolve this conflict. `,
			});

			return res.send({
				status: "success",
				message: `Sent a resolve conflict request email to ${req.user.email}`,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	importExcel: async (req, res) => {
		try {
			const result = excelToJson({
				sourceFile: req.file.path,
				header: { rows: 5 },
				columnToKey: {
					A: "index",
					B: "createdAt",
					C: "matterName",
					D: "matterCode",
					E: "client",
					H: "matterType",
					I: "partner",
				},
			});

			for (let i = 0; i < result.FS.length; i++) {
				const checkedMatter = await Matter.find({
					matterName: result.FS[i].matterName,
				});

				if (checkedMatter.length > 0) {
					continue;
				}

				const matterCreate = await Matter.create({
					matterName: result.FS[i].matterName,
					matterCode: result.FS[i].matterCode,
					client: result.FS[i].client,
					matterType: result.FS[i].matterType,
					assignedTo: result.FS[i].partner,
				});

				matterCreate.save();

				const partner = await User.find({ fullname: result.FS[i].partner });

				partner[0].matters.push(matterCreate.id);

				partner[0].save();

				const checkedUser = await User.find({
					fullname: result.FS[i].client,
				});
				if (checkedUser.length == 0) {
					const clientCreate = await User.create({
						fullname: result.FS[i].client,
						email: "",
						password: "123",
						role: "client",
						createdAt: moment().format(),
					});

					clientCreate.save();
				}
			}

			await unlinkFile(req.file.path);

			return res.send({
				status: "success",
				message: "success",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	exportExcelForChosenTeam: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				// Find all the timesheets of each users in each team
				// Write to excel file
			}
			return res.send({
				status: "success",
				message: "success",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateMatter: async (req, res) => {
		const matterUpdated = await Matter.findById(req.params.id);
		try {
			if (req.user.role == "admin") {
				if (req.body.matterName) {
					matterUpdated.matterName = req.body.matterName;
				}

				if (req.body.client) {
					matterUpdated.client = req.body.client;
					matterUpdated.contactEmail = req.body.contactEmail;
				}

				if (req.body.matterType) {
					matterUpdated.matterType = req.body.matterType;
				}

				if (req.body.description) {
					matterUpdated.description = req.body.description;
				}

				if (req.body.status) {
					matterUpdated.status = req.body.status;
				}

				if (req.body.followers) {
					if (matterUpdated.followers.length > 0) {
						// Pull the matter id out of all the old users
						await User.updateMany(
							{ _id: { $in: matterUpdated.followers } },
							{ $pull: { matters: req.params.id } }
						);
					}

					// Add matter id to user's matters array
					await User.updateMany(
						{ _id: { $in: req.body.followers } },
						{ $addToSet: { matters: req.params.id } }
					);

					matterUpdated.followers = req.body.followers;

					const project = await Project.find({
						matterCode: matterUpdated.matterCode,
					});

					await User.updateMany(
						{
							_id: { $in: req.body.followers },
						},
						{ $addToSet: { projects: project._id } }
					);
				}

				matterUpdated.save();

				return res.send({
					status: "success",
					message: "Update matter successfully",
					matter: matterUpdated,
				});
			} else {
				return res.send({
					status: "error",
					message: "Account does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteMatter: async (req, res) => {
		const matter = await Matter.findById(req.params.id);
		try {
			if (req.user.role == "admin") {
				const timesheetsOfMatter = matter.timesheet;

				for (let i = 0; i < timesheetsOfMatter.length; i++) {
					const user = await User.findById(timesheetsOfMatter[i].createdById);
					const timesheetOfUser = user.timesheets;
					const timesheetindexInUser = timesheetOfUser.indexOf(
						timesheetsOfMatter[i]
					);
					timesheetOfUser.splice(timesheetindexInUser, 1);
					user.save();

					if (timesheetsOfMatter[i].taskId) {
						const task = await Task.findById(timesheetsOfMatter[i].taskId);
						const timesheetsOfTask = task.timesheets;
						const timesheetindexInTask = timesheetsOfTask.indexOf(
							timesheetsOfMatter[i]
						);
						timesheetsOfTask.splice(timesheetindexInTask, 1);
						task.save();
					}

					await Timesheet.findByIdAndDelete(timesheetsOfMatter[i]);
				}

				await User.updateMany(
					{
						_id: { $in: matter.followers },
					},
					{
						$pull: {
							matters: req.params.id,
						},
					}
				);

				await Matter.findByIdAndDelete(req.params.id);

				return res.send({ status: "success", message: "Matter deleted" });
			} else {
				return res.send({
					status: "error",
					message: "Account does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = CRUDmatterCtrl;
