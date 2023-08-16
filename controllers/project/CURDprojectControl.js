const {
	Project,
	Step,
	Task,
	TaskFile,
	Checklist,
	InternalNotification,
	History,
} = require("#models").project;
const { Matter } = require("#models").matter;
const { User, Note } = require("#models");
const { Message } = require("#models").chatRoom;
const moment = require("moment");
// const { DateTime } = require("luxon");
const { catchAsync } = require("#utils");

var mongoose = require("mongoose");

function paginate(array, page_size, page_number) {
	// human-readable page numbers usually start with 1, so we reduce 1 in the first argument
	return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const CRUDprojectCtrl = {
	getProjects: async (req, res) => {
		try {
			const user = await User.findById(req.user.id);
			const page = req.query.page || 1;
			if (req.user.role == "admin") {
				const projects = await Project.aggregate([
					{
						$lookup: {
							from: "histories",
							as: "histories",
							let: { projectId: "$_id" },
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ["$projectId", "$$projectId"],
										},
									},
								},
								{ $sort: { createdAt: -1 } },
								{ $limit: 3 },
							],
						},
					},
					{
						$sort: {
							createdAt: -1,
						},
					},
				]);

				const result = paginate(projects, 8, page);
				const totalPage = parseInt(projects.length / 8);

				return res.send({
					status: "success",
					project: result,
					totalPage: totalPage,
				});
			} else {
				const mattersOfUser = user.matters;

				const projects = await Project.aggregate([
					{
						$match: {
							matterId: { $in: mattersOfUser },
						},
					},
					{
						$lookup: {
							from: "histories",
							as: "histories",
							let: { projectId: "$_id" },
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ["$projectId", "$$projectId"],
										},
									},
								},
								{ $sort: { createdAt: -1 } },
								{ $limit: 3 },
							],
						},
					},
					{
						$sort: {
							createdAt: -1,
						},
					},
				]);

				const result = paginate(projects, 8, page);
				const totalPage = parseInt(projects.length / 8);

				return res.send({
					status: "success",
					project: result,
					totalPage: totalPage,
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getProjectById: catchAsync(async (req, res) => {
		if (
			req.user.role !== "employee" &&
			req.user.role !== "admin" &&
			req.user.role !== "partner"
		)
			throw new Error("User does not have permission");
		let project = await Project.aggregate([
			{
				$match: {
					_id: new mongoose.Types.ObjectId(req.params.id),
				},
			},
			{
				$lookup: {
					from: "steps",
					as: "columns",
					let: { projectId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$projectId", "$$projectId"],
								},
							},
						},
						{
							$lookup: {
								from: "tasks",
								localField: "_id",
								foreignField: "stepId",
								as: "cards",
							},
						},
					],
				},
			},
			{
				$lookup: {
					from: "histories",
					as: "histories",
					let: { projectId: "$_id" },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$projectId", "$$projectId"],
								},
							},
						},
						{ $sort: { _id: -1 } },
						{ $limit: 3 },
					],
				},
			},
			{
				$set: {
					numTasks: {
						$reduce: {
							input: "$columns",
							initialValue: 0,
							in: {
								$add: ["$$value", { $size: "$$this.tasks" }],
							},
						},
					},
				},
			},
			{
				$project: {
					filesChat: 0,
					messages: 0,
					history: 0,
					tasks: 0,
				},
			},
		]);

		if (project.length === 0) throw new Error("Project not found");
		project = project[0];

		let stepIdsArray = [];
		for (i = 0; i < project.columns.length; i++) {
			const stepId = project.columns[i]._id;
			stepIdsArray.push(stepId);
		}

		project.steps = stepIdsArray;

		return res.send({ status: "success", project });
	}),

	getProjectByStatus: async (req, res) => {
		try {
			let tasks = await Task.aggregate([]);
			return res.send({
				status: "success",
				tasks: tasks,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getProjectStatusAnalysis: async (req, res) => {
		try {
			const statuses = ["Not started", "In progress", "Completed"];

			let analysis = [];
			for (let i = 0; i < statuses.length; i++) {
				let result = await Task.aggregate([
					{
						$match: {
							projectId: mongoose.Types.ObjectId(req.params.id),
							status: statuses[i],
						},
					},
					{
						$group: {
							_id: "$status",
							numTask: { $sum: 1 },
						},
					},
				]);

				if (result.length == 0) {
					result = [{ _id: statuses[i], numTask: 0 }];
				}

				analysis = analysis.concat(result);
			}

			let isLateRes = await Task.aggregate([
				{
					$match: {
						$and: [
							{ projectId: mongoose.Types.ObjectId(req.params.id) },
							{
								isLate: true,
							},
						],
					},
				},
				{
					$count: "numTask",
				},
				{
					$project: {
						_id: "Late",
						numTask: "$numTask",
					},
				},
			]);

			if (isLateRes.length > 0) {
				analysis.push(isLateRes[0]);
			} else {
				analysis.push({ _id: "Late", numTask: 0 });
			}

			const project = await Project.findById(req.params.id);
			const numUnfinishedTasks = project.numTasks - project.numFinishedTasks;

			return res.send({
				status: "success",
				result: analysis,
				numUnfinishedTasks: numUnfinishedTasks,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getProjectColumnsAnalysis: async (req, res) => {
		try {
			let result = await Task.aggregate([
				{
					$match: {
						projectId: mongoose.Types.ObjectId(req.params.id),
					},
				},
				{
					$group: {
						_id: {
							stepId: "$stepId",
							status: "$status",
						},
						numTasks: { $sum: 1 },
					},
				},
				{
					$group: {
						_id: "$_id.stepId",
						statuses: {
							$push: {
								status: "$_id.status",
								numTasks: "$numTasks",
							},
						},
					},
				},
				{
					$lookup: {
						from: "steps",
						localField: "_id",
						foreignField: "_id",
						as: "step",
					},
				},
				{
					$unwind: "$step",
				},
				{
					$sort: {
						"step.createdAt": 1,
					},
				},
				{
					$project: {
						_id: "$step.title",
						statuses: 1,
					},
				},
			]);

			let isLateResult = await Task.aggregate([
				{
					$match: {
						$and: [
							{
								projectId: mongoose.Types.ObjectId(req.params.id),
							},
							{
								isLate: true,
							},
						],
					},
				},
				{
					$group: {
						_id: "$stepId",
						numTasks: { $sum: 1 },
					},
				},
				{
					$lookup: {
						from: "steps",
						localField: "_id",
						foreignField: "_id",
						as: "step",
					},
				},
				{
					$unwind: "$step",
				},
				{
					$project: {
						_id: "$step.title",
						statuses: {
							status: "Late",
							numTasks: "$numTasks",
						},
					},
				},
			]);

			if (isLateResult.length > 0) {
				for (let x = 0; x < result.length; x++) {
					for (let y = 0; y < isLateResult.length; y++) {
						if (isLateResult[y]._id == result[x]._id) {
							result[x].statuses.push(isLateResult[y].statuses);
							continue;
						}
					}
				}
			}

			return res.send({
				status: "success",
				result: result,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getProjectMembersAnalysis: async (req, res) => {
		try {
			let result = await Task.aggregate([
				{
					$match: {
						projectId: mongoose.Types.ObjectId(req.params.id),
					},
				},
				{
					$unwind: "$assignedTo",
				},
				{
					$group: {
						_id: {
							assignedTo: "$assignedTo",
							status: "$status",
						},
						numTasks: {
							$sum: 1,
						},
					},
				},
				{
					$group: {
						_id: "$_id.assignedTo",
						tasks: {
							$push: {
								status: "$_id.status",
								numTasks: "$numTasks",
							},
						},
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "_id",
						foreignField: "_id",
						as: "user",
					},
				},
				{
					$unwind: "$user",
				},
				{
					$project: {
						_id: "$user.fullname",
						tasks: 1,
					},
				},
				{
					$sort: {
						_id: 1,
					},
				},
			]);

			let lateResult = await Task.aggregate([
				{
					$match: {
						$and: [
							{
								projectId: mongoose.Types.ObjectId(req.params.id),
							},
							{
								isLate: true,
							},
						],
					},
				},
				{
					$unwind: "$assignedTo",
				},
				{
					$group: {
						_id: "$assignedTo",
						tasks: {
							$push: {
								status: "Late",
								numTasks: { $sum: 1 },
							},
						},
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "_id",
						foreignField: "_id",
						as: "user",
					},
				},
				{
					$unwind: "$user",
				},
				{
					$project: {
						_id: "$user.fullname",
						tasks: 1,
					},
				},
			]);

			if (lateResult.length > 0) {
				for (let x = 0; x < lateResult.length; x++) {
					for (let y = 0; y < result.length; y++) {
						if (lateResult[x]._id == result[y]._id) {
							result[y].tasks.push(lateResult[x].tasks[0]);
							break;
						}
					}
				}
			}

			return res.send({
				status: "success",
				result: result,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getProjectDeadlineTasks: async (req, res) => {
		try {
			const tasks = await Task.find({
				$and: [{ projectId: req.params.id }, { deadline: { $ne: null } }],
			}).select({
				id: 1,
				title: 1,
				isLate: 1,
				deadline: 1,
				status: 1,
			});

			return res.send({
				status: "success",
				tasks: tasks,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addProjects: async (req, res) => {
		const { title, assignedTo, deadline, matterCode, matterId } = req.body;

		function getRandomNum(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		try {
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

			const projectCreate = await Project.create({
				title,
				personCreate: req.user.id,
				assignedTo,
				deadline,
				matterCode,
				matterId,
				backgroundColor: chosenColor,
			});

			const defaultStepsTitle = ["Step 1", "Step 2", "Step 3"];
			const defaultSteps = [];

			for (let i = 0; i < defaultStepsTitle.length; i++) {
				const newStep = await Step.create({
					title: defaultStepsTitle[i],
					projectId: projectCreate.id,
				});

				defaultSteps.push(newStep._id);
			}

			projectCreate.steps = defaultSteps;

			// Create History
			const history = await History.create({
				projectId: projectCreate.id,
				content: `<span style="font-weight: 600">${req.user.fullname}</span> has initialized the project`,
				type: "initialize",
			});

			history.save();
			projectCreate.history.push(history.id);

			projectCreate.save();

			await User.findByIdAndUpdate(req.user.id, {
				$push: {
					projects: {
						$each: [projectCreate.id],
						$position: 0,
					},
				},
			});

			const assignedToArr = projectCreate.assignedTo;

			// const indexOfSentUser = assignedToArr.indexOf(req.user.id);
			// const receiverIds = assignedToArr.splice(indexOfSentUser, 1);

			if (assignedToArr) {
				const noty = await InternalNotification.create({
					content: `<b>${req.user.fullname}</b> has opened a new project: <b>${projectCreate.title}</b>`,
					createdByImage: req.user.image_url,
					projectId: projectCreate.id,
					receiverId: assignedToArr,
					createdAt: moment().format(),
				});
				noty.save();

				for (let i = 0; i < assignedToArr.length; i++) {
					const user = await User.findById(assignedToArr[i]);
					const projectOfUser = user.projects;
					projectOfUser.push(projectCreate);
					const notiOfUser = user.internalNotifications;
					notiOfUser.push(noty.id);
					user.save();
				}

				// Emit event

				req.emit("SendInternalNotifications", noty);
			}

			return res.send({ status: "success", project: projectCreate });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [{ title: { $regex: `${q}`, $options: "i" } }],
			};
			let output = [];

			Project.find(query)
				.limit(8)
				.then((projects) => {
					if (projects && projects.length && projects.length > 0) {
						projects.forEach((project) => {
							const assignedToInProject = project.assignedTo;
							if (
								req.user.role === "admin" ||
								req.user.id == project.personCreate ||
								assignedToInProject.includes(req.user.id)
							) {
								output.push(project);
							}
						});
					}

					return res.send({ status: "success", project: output });
				});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateProjectsInfor: catchAsync(async (req, res) => {
		const project = await Project.findById(req.params.id);

		if (!project) throw new Error("Project not found");

		if (req.body.title) {
			project.title = req.body.title;
		}

		if (req.body.steps) {
			project.steps = req.body.steps.map(
				(step) => new mongoose.Types.ObjectId(step)
			);
		}

		if (req.body.assignedTo) {
			if (req.body.assignedTo.length > project.assignedTo) {
				let difference = req.body.assignedTo.filter(
					(x) => !project.assignedTo.includes(x)
				);

				const noty = await InternalNotification.create({
					content: `<b>${req.user.fullname}</b> has added you to the project: <b>${project.title}</b>`,
					createdByImage: req.user.image_url,
					projectId: project.id,
					receiverId: difference,
					createdAt: moment().format(),
				});
				noty.save();

				for (let i = 0; i < difference.length; i++) {
					const user = await User.findById(difference[i]);
					const notiOfUser = user.internalNotifications;
					notiOfUser.push(noty.id);
					user.save();
				}
			}

			project.assignedTo = req.body.assignedTo;
		}

		if (req.body.deadline) {
			project.deadline = req.body.deadline;
		}

		if (req.body.isFinished) {
			project.isFinished = req.body.isFinished;
		}

		project.save();

		return res.send({ status: "success", project: project });
	}),

	deleteProjects: catchAsync(async (req, res) => {
		const project = await Project.findByIdAndDelete(req.params.id, {
			returnOriginal: true,
		});
		if (!project) throw new Error("Project not found");
		// console.log(project);
		if (req.user.id !== project.personCreate && req.user.role !== "admin")
			throw new Error("User does not have the permission");
		// delete steps of project
		const stepsOfProject = project.steps;

		for (let i = 0; i < stepsOfProject.length; i++) {
			const step = await Step.findById(stepsOfProject[i]);
			// delete tasks of Step
			const tasksOfStep = step.tasks;
			for (let j = 0; j < tasksOfStep.length; j++) {
				const task = await Task.findById(tasksOfStep[j]);
				// delete notes
				const notesOfTask = task.notes;
				await Promise.all(
					notesOfTask.map(async (note) => Note.findByIdAndDelete(note.id))
				);
				// delete checklist
				const checklistOfTask = task.checklist;
				await Promise.all(
					checklistOfTask.map(async (checklist) =>
						Checklist.findByIdAndDelete(checklist.id)
					)
				);
				// delete taskfile
				const taskfileOfTask = task.taskFiles;
				taskfileOfTask.map(async (taskfile) =>
					TaskFile.findByIdAndDelete(taskfile.id)
				);
				// delete activities
				await Task.findByIdAndDelete(tasksOfStep[j]);
			}
			await Step.findByIdAndDelete(stepsOfProject[i]);
		}
		// delete message in project

		await Message.deleteMany({ projectId: req.params.id });

		//delete projectID in user schema
		const assignedToOfProject = project.assignedTo;
		for (let m = 0; m < assignedToOfProject.length; m++) {
			const user = await User.findById(assignedToOfProject[m]);
			const projectOfUser = user.projects;
			const projectindex = projectOfUser.indexOf(req.params.id);
			projectOfUser.splice(projectindex, 1);
			user.save();
		}

		return res.send({ status: "success", message: "Project deleted" });
	}),

	createAllProjectsBasedOnAllMatters: catchAsync(async (req, res) => {
		function getRandomNum(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		const matters = await Matter.find();

		for (let i = 0; i < matters.length; i++) {
			const matter = matters[i];
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

			const projectCreate = await Project.create({
				title: matter.matterName,
				assignedTo: matter.followers,
				matterCode: matter.matterCode,
				matterId: matter._id,
				backgroundColor: chosenColor,
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
		}
	}),
};
module.exports = CRUDprojectCtrl;
