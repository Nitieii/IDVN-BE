const PlannedTasks = require("../../models/plannedTasks/plannedTask.model");
const Team = require("../../models/team.model");
const Deadline = require("../../models/deadline.model");

const moment = require("moment");

const CURDPlannedTasksControl = {
	getPlannedTasksByTeam: async (req, res) => {
		try {
			if (
				req.user.role == "employee" ||
				req.user.role == "admin" ||
				req.user.role == "partner"
			) {
				// Declaration for the current week and day
				const week =
					moment().weekday() < 5 ? moment().week() : moment().week() + 1;
				const year = new Date().getFullYear();

				let plannedTasks = [];
				let query = {
					teamId: req.user.team,
					week: week,
					year: year,
				};

				// Change the query if the role is admin
				plannedTasks = await PlannedTasks.find(query).sort({ plannedHours: 1 });

				return res.send({
					status: "success",
					plannedTasks: plannedTasks,
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

	getPlannedTasksByUserId: async (req, res) => {
		try {
			if (
				req.user.role == "employee" ||
				req.user.role == "admin" ||
				req.user.role == "partner"
			) {
				const week =
					moment().weekday() < 5 ? moment().week() : moment().week() + 1;
				const year = new Date().getFullYear();

				const plannedTasks = await PlannedTasks.findOne({
					createdBy: req.user.id,
					week: week,
					year: year,
				}).select({
					id: 1,
					plannedHours: 1,
					tasks: 1,
				});

				return res.send({
					status: "success",
					plannedTasks: plannedTasks,
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

	createPlannedTasks: async (req, res) => {
		const { tasks, plannedHours } = req.body;
		try {
			if (
				req.user.role == "employee" ||
				req.user.role == "admin" ||
				req.user.role == "partner"
			) {
				moment.locale("en");

				const week =
					moment().weekday() < 5 ? moment().week() : moment().week() + 1;
				const year = new Date().getFullYear();

				const team = await Team.findById(req.user.team);
				if (!team) {
					return res.send({
						status: "error",
						message: "Team id does not exist",
					});
				}

				// Check if user has already created tasks
				const task = await PlannedTasks.find({
					createdBy: req.user.id,
					week: week,
					year: year,
				});

				if (task.length > 0) {
					return res.send({
						status: "error",
						message:
							"User has already created tasks for this week. Call edit task API instead.",
					});
				}

				// Add deadline to run job schedulers
				for (let i = 0; i < tasks.length; i++) {
					await Deadline.create({
						createdBy: req.user.id,
						task: tasks[i].name,
						status: tasks[i].status,
						deadline: tasks[i].deadline,
					});
				}

				const plannedTasks = await PlannedTasks.create({
					teamId: req.user.team,
					week: week,
					year: year,
					tasks,
					plannedHours,
					createdBy: req.user.id,
					createdByName: req.user.fullname,
				});

				team.plannedTasks.push(plannedTasks.id);
				team.save();

				// Real time update

				req.emit("AddPlannedTasks", plannedTasks);

				return res.send({
					status: "success",
					message: "Create planned tasks successfully",
					plannedTasks: plannedTasks,
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

	editPlannedTasks: async (req, res) => {
		try {
			// Find planned tasks
			const { plannedHours, tasks } = req.body;
			const plannedTasks = await PlannedTasks.findById(req.params.id);

			// moment.locale("en");

			if (!plannedTasks) {
				return res.send({
					status: "error",
					message: "Planned Task id does not exist",
				});
			}

			// Edit
			if (plannedHours) {
				plannedTasks.plannedHours = plannedHours;
			}

			if (tasks) {
				// Delete all the deadline of previous tasks
				await Deadline.deleteMany({
					createdBy: req.user.id,
				});

				// Create new Deadlines for updated tasks
				for (let i = 0; i < tasks.length; i++) {
					await Deadline.create({
						createdBy: req.user.id,
						task: tasks[i].name,
						status: tasks[i].status,
						deadline: tasks[i].deadline,
					});
				}

				// Update tasks array of planned tasks
				plannedTasks.tasks = tasks;
			}

			plannedTasks.save();

			return res.send({
				status: "success",
				message: "Edit planned tasks successfully",
				plannedTasks: plannedTasks,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = CURDPlannedTasksControl;
