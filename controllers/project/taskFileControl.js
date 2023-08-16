const TaskFile = require("../../models/project/taskFile.model");
const Task = require("../../models/project/task.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const fs = require("fs");

// const client = redis.createClient(REDIS_PORT);

const TaskFilesCtrl = {
	getTaskFiles: async (req, res) => {
		const fileOfTask = [];

		try {
			const taskfiles = await TaskFile.find();
			for (let i = 0; i < taskfiles.length; i++) {
				if (req.params.idtask == taskfiles[i].taskId) {
					fileOfTask.push(taskfiles[i]);
				}
			}
			return res.send({ status: "success", taskfile: fileOfTask });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	downloadTaskFile: async (req, res) => {
		try {
			const taskfiles = await TaskFile.findById(req.params.idtaskfile);
			var x = taskfiles.path;
			res.download(x);
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteTaskFile: async (req, res) => {
		try {
			const taskfile = await TaskFile.findById(req.params.idtaskfile);
			if (req.user.id == taskfile.userId) {
				// await fs.unlinkSync(taskfile.path);
				// taskfile.save();
				const task = await Task.findById(req.params.idtask);
				console.log("task: ", task);
				const fileOfTask = task.taskFiles;
				console.log("fileOfTask: ", fileOfTask);
				const taskfileindex = fileOfTask.indexOf(req.params.idtaskfile);
				fileOfTask.splice(taskfileindex, 1);
				task.save();
				await TaskFile.findByIdAndDelete(req.params.idtaskfile);
				return res.send({
					status: "success",
					message: "delete taskfile success",
				});
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

	ReadTaskFile: async (req, res) => {
		try {
			const taskfiles = await TaskFile.findById(req.params.idtaskfile);
			var x = taskfiles.path;
			fs.readFile(x, function (err, data) {
				res.contentType("application/pdf");
				return res.send({ status: "success", data: data });
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateTaskFiles: async (req, res) => {
		try {
			const taskfile = await TaskFile.findById(req.params.idtaskfile);

			if (req.user.id === taskfile.userId) {
				taskfile.title = req.body.title;
				taskfile.save();
				return res.send({ status: "success", message: "update success" });
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
};
module.exports = TaskFilesCtrl;
