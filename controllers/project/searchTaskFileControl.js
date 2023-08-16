const TaskFile = require("../../models/project/taskFile.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const SearchTaskFileCtrl = {
	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [
					{ title: { $regex: `${q}`, $options: "i" } },
					{ path: { $regex: `${q}`, $options: "i" } },
				],
			};
			let output = [];
			if (req.body.query === "") {
				const taskfile = await TaskFile.find();
				const taskfileArr = [];
				for (let i = 0; i < taskfile.length; i++) {
					if (taskfile[i].taskId == req.params.idtask) {
						taskfileArr.push(taskfile[i]);
					}
				}
				return res.send({ status: "success", taskfile: taskfileArr });
			} else {
				TaskFile.find(query)
					.limit(6)
					.then((files) => {
						console.log(files.taskId);
						if (files && files.length && files.length > 0) {
							files.forEach((file) => {
								if (file.taskId === req.params.idtask) {
									let obj = {
										title: file.title,
										path: file.path,
									};
									output.push(obj);
								}
							});
						}
						return res.send({ status: "success", taskfile: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = SearchTaskFileCtrl;
