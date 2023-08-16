const Matter = require("../../models/matter/matter.model");
const Task = require("../../models/project/task.model");

const User = require("../../models/user.model");
const Timesheet = require("../../models/matter/timesheet.model");
const Team = require("../../models/team.model");

// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const moment = require("moment");

const XLSX = require("xlsx");
const path = require("path");

// const client = redis.createClient(REDIS_PORT);

const CRUDtimesheetCtrl = {
	getAllTimeSheet: async (req, res) => {
		try {
			if (req.user.role === "admin") {
				const timesheetArr = await Timesheet.find().sort({ createdAt: -1 });

				return res.send({
					status: "success",
					timsheets: timesheetArr,
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getTimesheetByMatter: async (req, res) => {
		try {
			if (req.user.role === "admin" || req.user.role == "partner") {
				const timesheets = await Timesheet.find({
					matterId: req.params.idmatter,
				})
					.select({
						id: 1,
						createdBy: 1,
						description: 1,
						duration: 1,
						matterCode: 1,
						matterName: 1,
						date: 1,
						isEditable: 1,
					})
					.sort({ date: -1 });
				return res.send({
					status: "success",
					timsheets: timesheets,
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

	getTimesheetByUser: async (req, res) => {
		try {
			if (
				req.user.role == "employee" ||
				req.user.role == "admin" ||
				req.user.role == "partner"
			) {
				const timesheets = await Timesheet.find({
					createdById: req.user.id,
				})
					.select({
						id: 1,
						matterCode: 1,
						matterName: 1,
						description: 1,
						duration: 1,
						date: 1,
						createdAt: 1,
					})
					.sort({ date: -1 });

				return res.send({
					status: "success",
					timsheets: timesheets,
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getTimesheetInTeam: async (req, res) => {
		try {
			if (req.user.role == "admin" || req.user.role == "partner") {
				const team = await Team.findById(req.params.id);

				const members = team.members;

				await Timesheet.find({
					createdBy: {
						$in: members,
					},
				});

				// const teamOfPartner = partner.team;
				// const timesheetArr = [];
				// for (let i = 0; i < teamOfPartner.length; i++) {
				// 	const member = User.findById(teamOfPartner[i]);
				// 	const timesheetOfMember = member.timesheets;
				// 	for (let j = 0; j < timesheetOfMember.length; j++) {
				// 		const timesheet = await Timesheet.findById(timesheetOfMember[i]);
				// 		const result = {
				// 			id: timesheet.id,
				// 			createdBy: timesheet.createdBy,
				// 			createdAt: timesheet.createdAt,
				// 			description: timesheet.description,
				// 			matterCode: timesheet.matterCode,
				// 			matterName: timesheet.matterName,
				// 			duration: timesheet.duration,
				// 			charge: timesheet.charge,
				// 			isEditable: timesheet.isEditable,
				// 		};
				// 		timesheetArr.push(result);
				// 	}
				// 	const arrayTimesheetAfterSort = timesheetArr.sort(function (a, b) {
				// 		return new Date(b.createdAt) - new Date(a.createdAt);
				// 	});
				// 	return res.send({
				// 		status: "success",
				// 		timsheets: [],
				// 	});
				// }
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				matterId: req.params.idmatter,
				$or: [
					{ createdBy: { $regex: `${q}`, $options: "i" } },
					{ status: { $regex: `${q}`, $options: "i" } },
				],
			};
			let timesheets = [];

			if (req.user.role === "admin") {
				if (req.body.query === "") {
					timesheets = await Timesheet.find({
						matterId: req.params.idmatter,
					}).sort({ createdAt: -1 });
				} else {
					timesheets = Timesheet.find(query).sort({ createdAt: -1 });
				}
				return res.send({ status: "success", timsheets: timesheets });
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchByDateMatter: async (req, res) => {
		try {
			let q = req.body.date1;
			let p = req.body.date2;
			let q1 = moment(q);
			let p1 = moment(p);

			const timesheets = await Timesheet.find({
				matterId: req.params.idmatter,
				createdAt: {
					$gte: q1,
					$lte: p1,
				},
			});

			return res.send({ status: "success", timsheets: timesheets });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchByUser: async (req, res) => {
		try {
			let date1 = req.body.date1;
			let date2 = req.body.date2;
			let keyword = req.body.query;
			let q1 = moment(date1).format();
			let p1 = moment(date2).format();
			let query = {};

			// Get timesheet in one day only
			if (date1 && !date2) {
				p1 = moment(date1).add(1, "day").format();
				query = {
					createdById: req.user.id,
					date: {
						$gte: q1,
						$lt: p1,
					},
					$or: [
						{ matterName: { $regex: `${keyword}`, $options: "i" } },
						{ description: { $regex: `${keyword}`, $options: "i" } },
					],
				};
			}

			// Get timesheet between date range
			if (date1 && date2 && !keyword) {
				query = {
					$and: [
						{ createdById: req.user.id },
						{
							date: {
								$gte: q1,
								$lte: p1,
							},
						},
					],
				};
			}

			// Get timesheet between date and keywords
			if (date1 && date2 && keyword) {
				query = {
					$and: [
						{ createdById: req.user.id },
						{
							date: {
								$gte: q1,
								$lte: p1,
							},
						},
						{ matterName: keyword },
					],
				};
			}

			if (keyword && !date2 && !date1) {
				query = { matterName: keyword, createdById: req.user.id };
			}

			const timesheets = await Timesheet.find(query).sort({ date: -1 }).select({
				id: 1,
				matterCode: 1,
				matterName: 1,
				description: 1,
				duration: 1,
				date: 1,
				createdAt: 1,
			});

			return res.send({ status: "success", timesheets: timesheets });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchAll: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [
					{ createdBy: { $regex: `${q}`, $options: "i" } },
					{ matterCode: { $regex: `${q}`, $options: "i" } },
					{ matterName: { $regex: `${q}`, $options: "i" } },
				],
			};
			let timesheetArr = [];
			let output = [];
			if (req.body.query === "") {
				const timsheet = await Time2sheet.find();
				for (let i = 0; i < timsheet.length; i++) {
					timesheetArr.push(timsheet[i]);
				}
				return res.send({ status: "success", timesheets: timesheetArr });
			} else {
				Timesheet.find(query).then((timesheets) => {
					if (timesheets && timesheets.length && timesheets.length > 0) {
						timesheets.forEach((timesheet) => {
							let obj = {
								id: timesheet.id,
								matterName: timesheet.matterName,
								matterCode: timesheet.matterCode,
								description: timesheet.description,
								duration: timesheet.duration,
								charge: timesheet.charge,
								createdAt: timesheet.createdAt,
								createdBy: timesheet.createdBy,
								isEditable: timesheet.isEditable,
							};
							output.push(obj);
						});
					}
					return res.send({ status: "success", timesheets: output });
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getTimesheetById: async (req, res) => {
		try {
			const matter = Matter.findById(req.params.idmatter);
			const clientInMatter = matter.client;
			const partnerInMatter = matter.partner;
			const assignedToInMatter = matter.assignedTo;
			if (
				req.user.role === "admin" ||
				req.user.id == clientInMatter ||
				req.user.id == partnerInMatter ||
				req.user.id == matter.createdById ||
				assignedToInMatter.includes(req.user.id)
			) {
				const timesheet = Timesheet.findById(req.params.idtimesheet);
				const result = {
					id: timesheet.id,
					createdBy: timesheet.createdBy,
					createdAt: timesheet.createdAt,
					description: timesheet.description,
					matterCode: timesheet.matterCode,
					matterName: timesheet.matterName,
					duration: timesheet.duration,
					charge: timesheet.charge,
					isEditable: timesheet.isEditable,
				};
				return res.send({ status: "success", timesheets: result });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addTimesheet: async (req, res) => {
		const { description, duration, charge, date } = req.body;
		try {
			// Query matter info
			const matter = await Matter.findById(req.params.idmatter);

			// Create new timesheet
			const timesheetCreate = await Timesheet.create({
				matterCode: matter.matterCode,
				matterName: matter.matterName,
				description,
				duration,
				charge,
				createdById: req.user.id,
				createdBy: req.user.fullname,
				matterId: req.params.idmatter,
				date,
				createdAt: moment().format(),
			});
			timesheetCreate.save();

			// Push to matter timesheets array
			await Matter.findByIdAndUpdate(
				{ _id: req.params.idmatter },
				{ $push: { timesheet: timesheetCreate } }
			);

			// Update user timesheets array
			await User.findByIdAndUpdate(
				{ _id: req.user.id },
				{ $push: { timesheets: timesheetCreate.id } }
			);

			return res.send({ status: "success", timesheets: timesheetCreate });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addTimesheetByMatterCode: async (req, res) => {
		const { description, duration, matterCode, matterName, date } = req.body;
		try {
			const matter = await Matter.findOne({ matterCode, matterName });

			if (!matter) {
				return res.send({
					status: "error",
					message: "Matter not found",
				});
			}

			const timesheetCreate = await Timesheet.create({
				matterCode,
				matterName,
				description,
				duration,
				createdById: req.user.id,
				createdBy: req.user.fullname,
				matterId: matter.id,
				date,
				createdAt: moment().format(),
			});
			timesheetCreate.save();
			const timesheetOfMatter = matter.timesheet;
			timesheetOfMatter.push(timesheetCreate.id);
			if (req.body.duration) {
				if (
					isNaN(matter.totalWorkingHours) === false &&
					isNaN(timesheetCreate.duration) === false
				) {
					matter.totalWorkingHours =
						matter.totalWorkingHours + timesheetCreate.duration;
				}
			}
			matter.save();
			const userCreate = await User.findById(req.user.id);
			const timesheetOfUser = userCreate.timesheets;
			timesheetOfUser.push(timesheetCreate);

			const mattersOfUser = userCreate.matters;
			if (!mattersOfUser.includes(matter.id)) {
				mattersOfUser.push(matter.id);
			}

			userCreate.save();

			// Emit event

			req.emit("Addtimseheet", timesheetCreate);
			return res.send({ status: "success", timesheet: timesheetCreate });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateTimsheet: async (req, res) => {
		const timesheet = await Timesheet.findById(req.params.idtimesheet);

		try {
			if (
				req.user.role == "admin" ||
				req.user.role == "partner" ||
				req.user.id == timesheet.createdById
			) {
				if (req.body.description) {
					timesheet.description = req.body.description;
				}

				if (req.body.duration) {
					timesheet.duration = req.body.duration;
				}

				if (req.body.date) {
					timesheet.date = req.body.date;
				}

				if (req.body.matterCode && req.body.matterName) {
					const newMatterId = await Matter.findOne({
						matterCode: req.body.matterCode,
					}).select({
						id: 1,
					});

					// Delete the timesheet in the timesheet array of the old matter
					await Matter.findByIdAndUpdate(timesheet.matterId, {
						$pull: { timesheet: req.params.idtimesheet },
					});

					// Add the timesheet to the new matter
					await Matter.findOneAndUpdate(
						{ matterCode: req.body.matterCode },
						{ $push: { timesheet: req.params.idtimesheet } }
					);

					// Update timesheet info
					await Timesheet.findByIdAndUpdate(
						req.params.idtimesheet,

						{
							$set: {
								matterCode: req.body.matterCode,
								matterName: req.body.matterName,
								matterId: newMatterId.id,
							},
						}
					);
				}

				timesheet.save();

				return res.send({
					status: "success",
					message: "Update timesheet successfully",
					timesheet: timesheet,
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

	exportAllTeamsTimesheet: async (req, res) => {
		try {
			const { teams, date1, date2, type } = req.body;

			let dateStart;
			let dateEnd;

			const currentDate = new Date();

			if (type) {
				if (type == "Last Week") {
					// Calculate first and last date of current week
					const firstDate = moment().subtract(7, "days").format();
					const lastDate = moment().format();

					dateStart = moment(firstDate)
						.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
						.format();
					dateEnd = moment(lastDate)
						.set({ hour: 23, minute: 59, second: 59, millisecond: 0 })
						.format();
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

			// Find all teams
			const searchTeams = await Team.find({ _id: { $in: teams } });

			// Create new excel workbook
			const workBook = XLSX.utils.book_new();

			// Loop through each team
			for (let i = 0; i < searchTeams.length; i++) {
				const members = searchTeams[i].members;

				let teamArray = [];
				// Find all timesheets of each member in team
				for (let j = 0; j < members.length; j++) {
					const searchQuery = {
						$and: [
							{ createdById: members[j] },
							{
								date: {
									$gte: dateStart,
									$lte: dateEnd,
								},
							},
						],
					};

					// Get User name
					const userName = await User.findById(members[j]).select({
						fullname: 1,
					});

					const timesheets = await Timesheet.find(searchQuery).select({
						description: 1,
						matterName: 1,
						duration: 1,
					});

					if (timesheets.length > 0) {
						let obj = {
							Fullname: userName.fullname,
							Description: timesheets[0].description,
							Duration: timesheets[0].duration,
						};

						teamArray.push(obj);
						let eachUserTotalDuration = 0;

						let sum0 =
							parseInt(timesheets[0].duration.substring(1, 2)) +
							parseInt(timesheets[0].duration.substring(3, 5)) / 60;
						eachUserTotalDuration += sum0;

						// Loop through each user timesheets
						for (let k = 1; k < timesheets.length; k++) {
							obj = {
								Description: timesheets[k].description,
								Duration: timesheets[k].duration,
							};

							let hour = parseInt(timesheets[k].duration.substring(1, 2));
							let minute =
								parseInt(timesheets[k].duration.substring(3, 5)) / 60;
							let sum = hour + minute;
							eachUserTotalDuration += sum;

							teamArray.push(obj);
						}

						// Convert total minutes back to string format

						let totalMinutes = eachUserTotalDuration * 60;
						let hours = ("0" + Math.floor(totalMinutes / 60)).slice(-2);
						let minutes = ("0" + Math.floor(totalMinutes % 60)).slice(-2);

						let result = hours.concat("", ":", minutes);

						teamArray.push({ Description: "Total Time", Duration: result });
						teamArray.push({ Description: "", Duration: "" });
					} else {
						let obj = {
							Fullname: userName.fullname,
							Description: "",
							Duration: "00:00",
						};
						teamArray.push(obj);
						teamArray.push({ Description: "Total Time", Duration: "00:00" });
						teamArray.push({ Description: "", Duration: "" });
					}
				}

				console.log(teamArray);

				const workSheet = XLSX.utils.json_to_sheet(teamArray);

				XLSX.utils.book_append_sheet(workBook, workSheet, searchTeams[i].name);
				XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

				XLSX.write(workBook, { bookType: "xlsx", type: "binary" });

				XLSX.writeFile(workBook, path.join(__dirname, "/ReportDetail.xlsx"));
			}

			res.download(
				path.join(__dirname, "/ReportDetail.xlsx"),
				"WeeklyReport.xlsx",
				async function (err) {
					if (err) {
						console.log(err);
					} else {
						// await unlinkFile(path.join(__dirname, "/ReportDetail.xlsx"));
					}
				}
			);

			return;
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteTimesheet: async (req, res) => {
		const timesheet = await Timesheet.findById(req.params.idtimesheet);
		try {
			if (req.user.role == "admin" || req.user.id == timesheet.createdById) {
				// delete timesheet in matter
				if (timesheet.matterId) {
					const matter = await Matter.findById(timesheet.matterId);

					const timesheetOfMatter = matter.timesheet;
					const timesheetindex = timesheetOfMatter.indexOf(
						req.params.idtimesheet
					);
					timesheetOfMatter.splice(timesheetindex, 1);
					matter.save();
				}

				// delete timesheet in user
				const user = await User.findById(timesheet.createdById);
				const timesheetOfUser = user.timesheets;
				const timesheetindexInUser = timesheetOfUser.indexOf(
					req.params.idtimesheet
				);
				timesheetOfUser.splice(timesheetindexInUser, 1);
				user.save();

				// delete timesheet in task
				if (timesheet.taskId) {
					const task = await Task.findById(timesheet.taskId);
					const timesheetsOfTask = task.timesheets;
					const timesheetindexInTask = timesheetsOfTask.indexOf(
						req.params.idtimesheet
					);
					timesheetsOfTask.splice(timesheetindexInTask, 1);
					task.save();
				}

				await Timesheet.findByIdAndDelete(req.params.idtimesheet);

				return res.send({
					status: "success",
					message: "Delete timesheet successfully",
				});
			} else {
				return res.send({
					status: "error",
					message: "Account does not this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	fixTimesheetCreatedByName: async (req, res) => {
		try {
			await Timesheet.updateMany(
				{
					createdBy: "Minh Tam Do",
				},
				{
					$set: {
						createdBy: "Do Minh Tam",
					},
				}
			);

			return res.send({
				status: "success",
				message: "Fix timesheet created by name successfully",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteMultipleTimesheets: async (req, res) => {
		try {
			const arrayTimesheets = req.body.arrayTimesheets;

			for (let i = 0; i < arrayTimesheets.length; i++) {
				const timesheet = await Timesheet.findById(arrayTimesheets[i]);

				if (!timesheet) {
					return res.send({
						status: "error",
						message: "Some of the selected timesheets are not found",
					});
				}

				if (req.user.role == "admin" || req.user.id == timesheet.createdById) {
					// delete timesheet in matter
					if (timesheet.matterId) {
						await Matter.findByIdAndUpdate(timesheet.matterId, {
							$pull: {
								timesheet: arrayTimesheets[i],
							},
						});
					}

					// delete timesheet in user
					await User.findByIdAndUpdate(timesheet.createdById, {
						$pull: {
							timesheets: arrayTimesheets[i],
						},
					});

					// delete timesheet in task
					if (timesheet.taskId) {
						await Task.findByIdAndUpdate(timesheet.taskId, {
							$pull: {
								timesheets: arrayTimesheets[i],
							},
						});
					}

					// Delete timesheet
					await Timesheet.findByIdAndDelete(arrayTimesheets[i]);
				} else {
					return res.send({
						status: "error",
						message: "Account does not the permission",
					});
				}
			}

			return res.send({
				status: "success",
				message: "Delete multiple timesheets successfully",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = CRUDtimesheetCtrl;
