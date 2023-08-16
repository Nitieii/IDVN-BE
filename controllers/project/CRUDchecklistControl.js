const CheckList = require("../../models/project/checklist.model");
const Task = require("../../models/project/task.model");

const CRUDchecklistCtrl = {
	addCheckLists: async (req, res) => {
		try {
			const { isChecked, content } = req.body;
			const checklist = await CheckList.create({
				userId: req.user.id,
				taskId: req.params.idtask,
				isChecked,
				content,
			});

			checklist.save();

			await Task.findOneAndUpdate(
				{
					_id: req.params.idtask,
				},
				{ $push: { checklist: checklist.id }, $inc: { numChecklist: 1 } },
				{
					returnOriginal: false,
				}
			);

			return res.send({ status: "success", checklist: checklist });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateChecklist: async (req, res) => {
		try {
			const checklist = await CheckList.findById(req.params.idchecklist);

			if (checklist.isChecked === "true") {
				if (req.body.isChecked) {
					checklist.isChecked = req.body.isChecked;
					const task = await Task.findById(req.params.idtask);
					task.numFinishedChecklists = task.numFinishedChecklists - 1;
					task.save();
				}
			} else {
				if (req.body.isChecked) {
					checklist.isChecked = req.body.isChecked;
					const task = await Task.findById(req.params.idtask);
					task.numFinishedChecklists = task.numFinishedChecklists + 1;
					task.save();
				}
			}

			if (req.body.content) {
				checklist.content = req.body.content;
			}

			checklist.save();

			return res.send({ status: "success", message: "update success" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteChecklist: async (req, res) => {
		try {
			const checklist = await CheckList.findById(req.params.idchecklist);
			const task = await Task.findById(req.params.idtask);
			if (checklist.isChecked) {
				task.numFinishedChecklists = task.numFinishedChecklists - 1;
			}
			if (req.user.id === checklist.userId) {
				const checklistDeleted = await CheckList.findByIdAndDelete(
					req.params.idchecklist
				);

				const checklistOfTask = task.checklist;
				const checklistindex = checklistOfTask.indexOf(req.params.idchecklist);
				checklistOfTask.splice(checklistindex, 1);
				task.numChecklist = task.numChecklist - 1;
				// Emit event

				req.emit("Deletechecklist", checklistDeleted);
				task.save();
				return res.send({ status: "success", message: "Checklist deleted." });
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
};
module.exports = CRUDchecklistCtrl;
