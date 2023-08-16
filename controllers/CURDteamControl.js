const User = require("../models/user.model");
const Team = require("../models/team.model");
const Timesheet = require("../models/matter/timesheet.model");
const TimeOff = require("../models/timeOff/timeOff.model");

const moment = require("moment");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const CRUDuserCtrl = {
	getTeams: async (req, res) => {
		try {
			if (req.user.role == "admin" || req.user.role == "partner") {
				const teams = await Team.find().sort({ partner: -1 });

				return res.send({ status: "success", teams: teams });
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

	getTeamById: async (req, res) => {
		try {
			if (
				req.user.role == "admin" ||
				req.user.role == "employee" ||
				req.user.role == "partner"
			) {
				const team = await Team.findById(req.params.id)
					.sort({ created: -1 })
					.select({
						id: 1,
						name: 1,
						partner: 1,
						members: 1,
					});

				if (!team) {
					return res.send({
						status: "error",
						message: "Team Id does not exist",
					});
				}

				const teamUsers = await User.find({
					_id: { $in: team.members },
				})
					.select({
						fullname: 1,
						email: 1,
						phonenumber: 1,
						role: 1,
						province: 1,
						createdAt: 1,
						billingRate: 1,
						image_url: 1,
						backgroundColor: 1,
					})
					.sort({ createdAt: -1 });

				return res.send({ status: "success", team: team, members: teamUsers });
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

	createTeam: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				const { name, partner, members } = req.body;

				const checkedTeam = await Team.find({
					$or: [{ name: name }, { partner: partner }],
				});

				if (checkedTeam.length > 0) {
					return res.send({
						status: "error",
						message: "Team name or partner already exist",
					});
				}

				const newTeam = await Team.create({
					name,
					partner,
					members,
				});

				newTeam.save();

				return res.send({
					status: "success",
					message: "Create team successfully",
					team: newTeam,
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

	editTeam: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				const team = await Team.findById(req.params.id);

				if (req.body.name) {
					team.name = req.body.name;
				}

				if (req.body.partner) {
					team.partner = req.body.partner;
				}

				if (req.body.members) {
					team.members = req.body.members;

					await User.updateMany(
						{ _id: { $in: req.body.members } },
						{ $set: { team: req.params.id } }
					);
				}

				team.save();

				return res.send({
					status: "success",
					message: "Edit team information successfully",
					team: team,
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

	getTeamAnalysis: async (req, res) => {
		// Handle username
		function postProcess(users) {
			return users.map(function (user) {
				return user.fullname;
			});
		}

		try {
			const { date1, date2, type, mode, teams } = req.body;

			let dateStart;
			let dateEnd;

			const currentDate = new Date();

			// Handle date range
			if (type) {
				if (type == "Last Week") {
					// Calculate first and last date of current week

					const firstDate = moment().subtract(8, "days").format();
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

			// Declare team result
			const resultsArray = [];

			const workBook = XLSX.utils.book_new();

			for (let p = 0; p < teams.length; p++) {
				const team = await Team.findById(teams[p]);

				const teamMembers = team.members;

				const users = await User.find({
					_id: { $in: teamMembers },
				}).select({ fullname: 1 });

				const usernames = postProcess(users);

				const result = await Timesheet.aggregate([
					{
						$match: {
							$and: [
								{ createdBy: { $in: usernames } },
								{ date: { $gte: dateStart, $lte: dateEnd } },
							],
						},
					},
					{
						$addFields: {
							TotalMinutes: {
								$add: [
									{
										$toInt: {
											$substr: ["$duration", 3, 2],
										},
									},
									{
										$multiply: [
											{
												$toInt: {
													$substr: ["$duration", 0, 2],
												},
											},
											60,
										],
									},
								],
							},
						},
					},
					{
						$group: {
							_id: {
								createdBy: "$createdBy",
								matterName: "$matterName",
							},
							totalMinutes: {
								$sum: "$TotalMinutes",
							},
						},
					},
					{
						$set: {
							hours: {
								$divide: ["$totalMinutes", 60],
							},
						},
					},
					{
						$set: {
							hours: {
								$floor: {
									$divide: ["$totalMinutes", 60],
								},
							},
							minutes: {
								$mod: ["$totalMinutes", 60],
							},
						},
					},
					{
						$set: {
							hours: {
								$cond: {
									if: {
										$lt: ["$hours", 10],
									},
									then: {
										$concat: [
											"0",
											{
												$toString: "$hours",
											},
										],
									},
									else: {
										$toString: "$hours",
									},
								},
							},
							minutes: {
								$cond: {
									if: {
										$lt: ["$minutes", 10],
									},
									then: {
										$concat: [
											"0",
											{
												$toString: "$minutes",
											},
										],
									},
									else: {
										$toString: "$minutes",
									},
								},
							},
						},
					},
					{
						$group: {
							_id: "$_id.createdBy",
							timesheets: {
								$push: {
									matterName: "$_id.matterName",
									hours: {
										$concat: ["$hours", ":", "$minutes"],
									},
								},
							},
							totalHours: {
								$sum: "$totalMinutes",
							},
							total: {
								$sum: "$totalMintues",
							},
						},
					},
					{
						$set: {
							hours: {
								$divide: ["$totalHours", 60],
							},
						},
					},
					{
						$set: {
							hours: {
								$floor: {
									$divide: ["$totalHours", 60],
								},
							},
							minutes: {
								$mod: ["$totalHours", 60],
							},
						},
					},
					{
						$set: {
							hours: {
								$cond: {
									if: {
										$lt: ["$hours", 10],
									},
									then: {
										$concat: [
											"0",
											{
												$toString: "$hours",
											},
										],
									},
									else: {
										$toString: "$hours",
									},
								},
							},
							minutes: {
								$cond: {
									if: {
										$lt: ["$minutes", 10],
									},
									then: {
										$concat: [
											"0",
											{
												$toString: "$minutes",
											},
										],
									},
									else: {
										$toString: "$minutes",
									},
								},
							},
						},
					},
					{
						$project: {
							_id: 1,
							timesheets: 1,
							total: {
								$concat: ["$hours", ":", "$minutes"],
							},
							totalHours: {
								$divide: ["$totalHours", 60],
							},
						},
					},
					{
						$group: {
							_id: null,
							docs: {
								$push: "$$ROOT",
							},
						},
					},
					{
						$set: {
							docs: {
								$map: {
									input: usernames,
									as: "name",
									in: {
										$let: {
											vars: {
												findName: {
													$first: {
														$filter: {
															input: "$docs",
															as: "d",
															cond: {
																$eq: ["$$d._id", "$$name"],
															},
														},
													},
												},
											},
											in: {
												$cond: {
													if: "$$findName",
													then: "$$findName",
													else: {
														_id: "$$name",
														total: "00:00",
														totalHours: 0,
													},
												},
											},
										},
									},
								},
							},
						},
					},
					{
						$unwind: "$docs",
					},
					{
						$replaceRoot: {
							newRoot: "$docs",
						},
					},
					{
						$sort: {
							total: 1,
						},
					},
				]);

				const timeOffs = await TimeOff.find({
					start: {
						$gte: moment(dateStart).format("YYYY-MM-DD"),
						$lte: moment(dateEnd).format("YYYY-MM-DD"),
					},
				}).select({
					title: 1,
					duration: 1,
				});

				// Check if total duration is under 30 hours
				for (let l = 0; l < result.length; l++) {
					if (result[l].totalHours < 30) {
						result[l]["isValid"] = false;
					} else {
						result[l]["isValid"] = true;
					}
				}

				// Check also with timeoffs
				if (timeOffs.length > 0) {
					for (let n = 0; n < timeOffs.length; n++) {
						for (let i = 0; i < result.length; i++) {
							if (result[i]._id == timeOffs[n].title) {
								result[i]["daysOff"] = timeOffs[n].duration;
								if (timeOffs[n].duration * 6 + result[i].totalHours >= 30) {
									result[i]["isValid"] = true;
								} else {
									result[i]["isValid"] = false;
								}
							}
						}
					}
				}

				const arrayExcel = [];
				if (mode !== "chart") {
					for (let m = 0; m < result.length; m++) {
						if (result[m].timesheets) {
							arrayExcel.push({
								Fullname: result[m]._id,
								"Matter Name": "",
								Duration: "",
								"Enough timesheets?": result[m].isValid,
								"Day Offs": result[m].daysOff ? result[m].daysOff : "",
							});
							for (let k = 0; k < result[m].timesheets.length; k++) {
								arrayExcel.push({
									"Matter Name": result[m].timesheets[k].matterName,
									Duration: result[m].timesheets[k].hours,
								});
							}
						} else {
							arrayExcel.push({
								Fullname: result[m]._id,
								"Matter Name": "",
								Duration: "",
								"Enough timesheets?": result[m].isValid,
								"Day Offs": result[m].daysOff ? result[m].daysOff : "",
							});
						}
						arrayExcel.push({
							"Matter Name": "Total Time",
							Duration: result[m].total,
						});

						arrayExcel.push({
							"Matter Name": "",
							Duration: "",
						});
					}

					const workSheet = XLSX.utils.json_to_sheet(arrayExcel);

					XLSX.utils.book_append_sheet(workBook, workSheet, team.name);
					XLSX.write(workBook, { bookType: "xlsx", type: "buffer" });

					XLSX.write(workBook, { bookType: "xlsx", type: "binary" });

					XLSX.writeFile(workBook, path.join(__dirname, "/ReportDetail.xlsx"));
				}

				resultsArray.push({
					_id: team.name,
					result: result,
				});
			}

			if (mode == "chart") {
				return res.send({
					status: "success",
					result: resultsArray,
				});
			} else {
				res.download(
					path.join(__dirname, "/ReportDetail.xlsx"),
					"WeeklyReport.xlsx",
					async function (err) {
						if (err) {
							console.log(err);
						} else {
							await fs.promises.unlink(
								path.join(__dirname, "/ReportDetail.xlsx")
							);
						}
					}
				);
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	mattersTeamAnalysis: async (req, res) => {
		function postProcess(users) {
			return users.map(function (user) {
				return user.fullname;
			});
		}
		try {
			const team = await Team.findById(req.params.id);

			const teamMembers = team.members;

			const users = await User.find({
				_id: { $in: teamMembers },
			}).select({ fullname: 1 });

			const usernames = postProcess(users);

			const { date1, date2, type } = req.body;

			let dateStart;
			let dateEnd;

			const currentDate = new Date();
			// Handle date range

			if (type) {
				if (type == "Last Week") {
					// Calculate first and last date of current week
					const firstDate = moment().subtract(8, "days").format();
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

			const matters = await Timesheet.aggregate([
				{
					$match: {
						$and: [
							{ createdBy: { $in: usernames } },
							{ date: { $gte: dateStart, $lte: dateEnd } },
							{
								matterName: {
									$nin: ["Matter Test"],
								},
							},
						],
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "createdBy",
						foreignField: "fullname",
						as: "user",
					},
				},
				{
					$replaceRoot: {
						newRoot: {
							$mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"],
						},
					},
				},
				{
					$addFields: {
						TotalMinutes: {
							$add: [
								{
									$toInt: {
										$substr: ["$duration", 3, 2],
									},
								},
								{
									$multiply: [
										{
											$toInt: {
												$substr: ["$duration", 0, 2],
											},
										},
										60,
									],
								},
							],
						},
					},
				},
				{
					$addFields: {
						TotalMinutes: {
							$divide: ["$TotalMinutes", 60],
						},
					},
				},
				{
					$addFields: {
						totalBill: {
							$multiply: ["$TotalMinutes", "$billingRate"],
						},
					},
				},

				{
					$group: {
						_id: {
							createdBy: "$createdBy",
							matterName: "$matterName",
						},
						totalBills: { $sum: "$totalBill" },
						TotalMinutes: {
							$sum: "$TotalMinutes",
						},
					},
				},
				{
					$group: {
						_id: "$_id.matterName",
						totalDuration: {
							$sum: "$TotalMinutes",
						},
						bill: { $sum: "$totalBills" },
						timesheets: {
							$push: {
								name: "$_id.createdBy",
								duration: "$TotalMinutes",
							},
						},
					},
				},
				{
					$sort: {
						totalDuration: -1,
					},
				},
			]);

			// Get data for Pie Chart

			const nonBill = await Timesheet.aggregate([
				{
					$match: {
						$and: [
							{ createdBy: { $in: usernames } },
							{ date: { $gte: dateStart, $lte: dateEnd } },
							{
								matterName: {
									$in: ["BD & PR", "KM", "Potential Matters"],
								},
							},
						],
					},
				},
				{
					$addFields: {
						TotalMinutes: {
							$add: [
								{ $toInt: { $substr: ["$duration", 3, 2] } },
								{
									$multiply: [{ $toInt: { $substr: ["$duration", 0, 2] } }, 60],
								},
							],
						},
					},
				},
				{
					$group: {
						_id: "$matterName",
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

			return res.send({
				status: "success",
				matters: matters,
				overview: nonBill,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	overviewMattersTeamAnalysis: async (req, res) => {
		try {
			const { matterName } = req.body;

			// Handle date range
			const result = await Timesheet.aggregate([
				{
					$match: {
						matterName: matterName,
					},
				},
				{
					$addFields: {
						TotalMinutes: {
							$add: [
								{
									$toInt: {
										$substr: ["$duration", 3, 2],
									},
								},
								{
									$multiply: [
										{
											$toInt: {
												$substr: ["$duration", 0, 2],
											},
										},
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
						totalMinutes: {
							$sum: "$TotalMinutes",
						},
					},
				},
				{
					$group: {
						_id: null,
						docs: {
							$push: "$$ROOT",
						},
					},
				},
				{
					$unwind: "$docs",
				},
				{
					$replaceRoot: {
						newRoot: "$docs",
					},
				},
				{
					$set: {
						hours: {
							$divide: ["$totalMinutes", 60],
						},
					},
				},
				{
					$project: {
						duration: "$hours",
					},
				},
			]);

			return res.send({
				status: "success",
				result: result,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteTeam: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				await Team.findByIdAndDelete(req.params.id);
				return res.send({
					status: "success",
					message: "Delete team successfully",
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
};

module.exports = CRUDuserCtrl;
