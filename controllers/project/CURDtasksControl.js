const { Task, History, Project, Step, InternalNotification } =
	require("#models").project;
const { User } = require("#models");
const { Matter, Timesheet } = require("#models").matter;

const mongoose = require("mongoose");
const { catchAsync, sendNoti } = require("#utils");

const getTaskDetail = catchAsync(async (req, res) => {
	if (
		req.user.role !== "admin" &&
		req.user.role !== "partner" &&
		req.user.role !== "employee"
	)
		throw new Error("User does not have the permission");
	let result = await Task.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(req.params.id),
			},
		},
		{
			$lookup: {
				from: "checklists",
				localField: "_id",
				foreignField: "taskId",
				as: "checklist",
			},
		},
		{
			$lookup: {
				from: "notes",
				localField: "_id",
				foreignField: "taskId",
				as: "notes",
			},
		},
		{
			$lookup: {
				from: "taskfiles",
				localField: "_id",
				foreignField: "taskId",
				as: "taskfiles",
			},
		},
	]);
	if (result.length === 0) throw new Error("Task not found");

	return res.send({ status: "success", task: result[0] });
});

const getTasksByProject = catchAsync(async (req, res) => {
	const tasks = await Task.aggregate()
		.match({ projectId: new mongoose.Types.ObjectId(req.params.idproject) })
		.sort({ _id: -1 });
	if (tasks.length === 0) throw new Error("Task not found");
	return res.send({ status: "success", tasks });
});

const addTasks = catchAsync(async (req, res) => {
	// console.time("addTasks");
	const projectById = await Project.findById(req.params.idproject);

	if (!projectById) throw new Error("Project not found");

	const { title, assignedTo, deadline } = req.body;

	if (
		req.user.role !== "admin" &&
		req.user.role !== "partner" &&
		!projectById.assignedTo.includes(req.user.id)
	)
		throw new Error("User does not have the permission");

	const taskCreate = new Task({
		title,
		stepId: req.params.idstep,
		projectId: req.params.idproject,
		assignedTo,
		deadline,
	});

	await taskCreate.save();

	if (assignedTo.length > 0) {
		const setOfAssignedTo = new Set(projectById.assignedTo);
		assignedTo.forEach((userId) => setOfAssignedTo.add(userId));
		projectById.assignedTo = Array.from(setOfAssignedTo);

		if (setOfAssignedTo.size > projectById.assignedTo.length) {
			await User.updateMany(
				{ _id: { $in: projectById.assignedTo } },
				{
					$push: {
						projects: req.params.idproject,
					},
				}
			);
		}
	}

	projectById.numTasks += 1;
	projectById.save();

	// Create history
	History.create({
		projectId: new mongoose.Types.ObjectId(projectById.id),
		content: `<span style="font-weight: 600">${req.user.fullname}</span> has added a new task <span style="font-weight: 600">${taskCreate.title}</span>`,
		type: "taskCreate",
	});

	// create notification
	InternalNotification.create({
		content: `<b>${req.user.fullname}</b> has added a new task <b>${taskCreate.title}</b> to the project: <b>${projectById.title}</b>`,
		createdByImage: req.user.image_url,
		projectId: projectById.id,
		receiverId: assignedTo,
	});

	const tokens = await User.aggregate()
		.match({
			_id: {
				$in: projectById.assignedTo.map(
					(userId) => new mongoose.Types.ObjectId(userId)
				),
			},
		})
		.unwind("firToken")
		.group({
			_id: null,
			tokens: { $push: "$firToken" },
		});

	if (tokens.length > 0) {
		sendNoti(
			{
				title: "Assigned to a new task",
				body: `${req.user.fullname} has added a new task ${taskCreate.title} to the project: ${projectById.title}`,
			},
			tokens[0].tokens,
			"project",
			`/project/${projectById.id}`
		);
	}

	// Emit event
	req.emit("AddTask", taskCreate);
	req.emit(
		"SendInternalNotifications",
		`<b>${req.user.fullname}</b> has added a new task: <b>${taskCreate.title}</b> to the project: <b>${projectById.title}</b>`
	);

	return res.send({ status: "success", task: taskCreate });
});

const addTimesheetByTask = catchAsync(async (req, res) => {
	try {
		const task = await Task.findById(req.params.id);

		const { description, duration, charge, matterCode, matterName } = req.body;

		const matter = await Matter.findOne({ matterCode });

		const timesheetCreate = await Timesheet.create({
			matterCode,
			matterName,
			description,
			duration,
			charge,
			taskId: req.params.id,
			createdById: req.user.id,
			createdBy: req.user.fullname,
			matterId: matter.id,
		});
		timesheetCreate.save();

		task.timesheets.push(timesheetCreate);
		task.save();

		const timesheetOfMatter = matter.timesheet;
		timesheetOfMatter.push(timesheetCreate);
		matter.save();

		const userCreate = await User.findById(req.user.id);
		const timesheetOfUser = userCreate.timesheets;
		timesheetOfUser.push(timesheetCreate);
		userCreate.save();

		return res.send({ status: "success", timesheet: timesheetCreate });
	} catch (err) {
		return res.send({ status: "error", message: err.message });
	}
});

const getTimesheetsByTask = catchAsync(async (req, res) => {
	try {
		const task = await Task.findById(req.params.idtask);
		const timesheetsOfTask = task.timesheets;
		const timesheetArr = [];

		for (let i = 0; i < timesheetsOfTask.length; i++) {
			const timesheet = await Timesheet.findById(timesheetsOfTask[i]);
			timesheetArr.push(timesheet);
		}

		return res.send({ status: "success", timesheets: timesheetArr });
	} catch (err) {
		return res.send({ status: "error", message: err.message });
	}
});

const updateTask = catchAsync(async (req, res) => {
	try {
		const task = await Task.findById(req.params.idtask);
		const project = await Project.findById(task.projectId);

		if (req.body.title) {
			task.title = req.body.title;
		}
		if (req.body.description) {
			task.description = req.body.description;
		}

		if (req.body.stepId) {
			task.stepId = req.body.stepId;
		}

		if (req.body.assignedTo) {
			if (req.body.assignedTo.length === 0) {
				task.assignedTo = [];
			} else {
				let difference = req.body.assignedTo.filter(
					(x) => !project.assignedTo.includes(x)
				);

				await User.updateMany(
					{
						_id: { $in: difference },
					},
					{ $push: { projects: task.projectId } }
				);

				project.assignedTo = project.assignedTo.concat(difference);

				// const noty = await InternalNotification.create({
				//   content: `<b>${req.user.fullname}</b> has assigned you to the task <b>${task.title}</b> you in the project: <b>${project.title}</b>`,
				//   createdByImage: req.user.image_url,
				//   projectId: project.id,
				//   receiverId: difference,
				//   createdAt: moment().format(),
				// });
				// noty.save();

				// for (let i = 0; i < difference.length; i++) {
				//   const user = await User.findById(difference[i]);np
				//   const notiOfUser = user.internalNotifications;
				//   notiOfUser.push(noty.id);
				//   user.save();
				// }

				task.assignedTo = req.body.assignedTo;
			}
		}

		if (task.status === "Completed") {
			if (req.body.status) {
				if (req.body.status === "Completed") {
					task.status = req.body.status;
				} else {
					task.status = req.body.status;
					project.numFinishedTasks = project.numFinishedTasks - 1;
					// update numfinishedTask in step
				}
			}
		} else {
			if (req.body.status) {
				if (req.body.status === "Completed") {
					task.status = req.body.status;
					// update numfinishedTask in project
					project.numFinishedTasks = project.numFinishedTasks + 1;
					// update numfinishedTask in step
				} else {
					task.status = req.body.status;
				}
			}
		}

		task.save();
		project.save();

		// Emit even

		return res.send({ status: "success", message: "Update success" });
	} catch (err) {
		return res.send({ status: "error", message: err.message });
	}
});

const search = catchAsync(async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		const projectOfUser = user.projects;
		let q = req.body.query;
		let query = {
			$or: [
				{ title: { $regex: `${q}`, $options: "i" } },
				{ status: { $regex: `${q}`, $options: "i" } },
			],
		};
		const taskArr = [];
		if (req.body.query === "") {
			for (let i = 0; i < projectOfUser.length; i++) {
				if (
					projectOfUser[i] == req.params.idproject ||
					req.user.role === "admin"
				) {
					const task = Task.find();
					for (let j = 0; j < task.length; j++) {
						if (task[j].projectId == req.params.idproject) {
							taskArr.push(task[j]);
						}
					}
				}
			}
			return res.send({ status: "success", tasks: taskArr });
		} else {
			for (let i = 0; i < projectOfUser.length; i++) {
				if (
					projectOfUser[i] == req.params.idproject ||
					req.user.role === "admin"
				) {
					Task.find(query)
						.limit(6)
						.then((tasks) => {
							if (tasks && tasks.length && tasks.length > 0) {
								tasks.forEach((task) => {
									if (task.projectId == req.params.idproject) {
										let obj = {
											title: task.title,
											description: task.description,
											status: task.status,
											checklist: task.checklist,
											numChecklist: task.numChecklist,
											assignedTo: task.assignedTo,
											deadline: task.deadline,
											taskFiles: task.taskFiles,
											activities: task.activities,
											createdAt: task.createdAt,
										};
										taskArr.push(obj);
									}
								});
								return res.send({ status: "success", tasks: taskArr });
							}
						});
				}
			}
		}
	} catch (err) {
		return res.send({ status: "error", message: err.message });
	}
});

const deleteTask = catchAsync(async (req, res) => {
	const task = await Task.findById(req.params.idtask);
	const project = await Project.findById(req.params.idproject);

	if (task.status == "Completed") {
		project.numFinishedTasks = project.numFinishedTasks - 1;
	}

	project.numTasks = project.numTasks - 1;
	project.save();

	await Task.findByIdAndDelete(req.params.idtask);

	const step = await Step.findById(req.params.idstep);

	if (task.status == "Completed") {
		step.numFinishedTasks = step.numFinishedTasks - 1;
	}

	const tasksArray = step.tasks;
	const deletedTaskIndex = tasksArray.indexOf(req.params.idtask);

	tasksArray.splice(deletedTaskIndex, 1);
	step.numTasks = step.numTasks - 1;
	step.save();

	return res.send({ status: "success", message: "Task deleted." });
});

module.exports = {
	getTaskDetail,
	getTasksByProject,
	addTasks,
	addTimesheetByTask,
	getTimesheetsByTask,
	updateTask,
	search,
	deleteTask,
};
