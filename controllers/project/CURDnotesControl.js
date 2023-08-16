const Note = require("../../models/note.model");
const Task = require("../../models/project/task.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const moment = require("moment");

// const client = redis.createClient(REDIS_PORT);

const CRUDnotesCtrl = {
	addnotes: async (req, res) => {
		const { description } = req.body;
		try {
			const note = await Note.create({
				taskId: req.params.idtask,
				userId: req.user.id,
				userImg: req.user.image_url,
				userName: req.user.fullname,
				description,
				createdAt: moment().format(),
			});
			note.save();

			await Task.findOneAndUpdate(
				{
					_id: req.params.idtask,
				},
				{
					$push: {
						notes: note,
					},
				}
			);

			return res.send({ status: "success", note: note });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNotes: async (req, res) => {
		try {
			const result = await Note.findOneAndUpdate(
				{
					_id: req.params.id,
				},
				{
					$set: req.body,
				},
				{
					returnOriginal: false,
				}
			);

			return res.send({ status: "success", note: result });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteNotes: async (req, res) => {
		try {
			const note = await Note.findById(req.params.idnote);

			if (req.user.id === note.userId) {
				await Note.findByIdAndDelete(req.params.idnote);

				const task = await Task.findById(req.params.idtask);
				const noteOfTask = task.notes;
				const noteindex = noteOfTask.indexOf(req.params.idnote);
				noteOfTask.splice(noteindex, 1);

				task.save();

				return res.send({ status: "success", message: "Note deleted" });
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
module.exports = CRUDnotesCtrl;
