const NoteSub = require("../../models/note/noteSub.model");
const NoteGlobal = require("../../models/note/noteGlobal.model");
const moment = require("moment");

const CRUDnotesSubCtrl = {
	getNotes: async (req, res) => {
		try {
			const note = await NoteGlobal.findById(req.params.idnote);
			const memberOfTeam = note.teamMembers;
			if (memberOfTeam.includes(req.user.id)) {
				const noteSubs = note.noteSubs;
				const arrayNoteSub = [];
				for (let i = 0; i < noteSubs.length; i++) {
					const noteSub = await NoteSub.findById(noteSubs[i]);
					arrayNoteSub.push(noteSub);
				}
				const noteSubAfterSort = arrayNoteSub.sort(function (a, b) {
					return new Date(b.createdAt) - new Date(a.createdAt);
				});
				return res.send({ status: "success", notesub: noteSubAfterSort });
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

	addnoteSub: async (req, res) => {
		const { title, description, color } = req.body;
		try {
			const noteSub = await NoteSub.create({
				title,
				description,
				color,
				createdBy: req.user.id,
				userImg: req.user.image_url,
				createdByName: req.user.fullname,
				addnoteSub: req.params.idnote,
				createdAt: moment().format(),
			});
			noteSub.save();
			// Emit event

			req.emit("AddNoteSub", noteSub);
			return res.send({ status: "success", notesub: noteSub });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNoteSub: async (req, res) => {
		try {
			const noteSub = await NoteSub.findById(req.params.idnotesub);
			if (req.user.id === noteSub.createdBy) {
				if (req.body.title) {
					noteSub.title = req.body.title;
				}
				if (req.body.description) {
					noteSub.description = req.body.description;
				}
				if (req.body.color) {
					noteSub.color = req.body.color;
				}
				noteSub.save();
				// Emit event

				req.emit("noteSubUpdated", noteSub);
				return res.send({ status: "success", message: "update success" });
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

	deleteNoteSub: async (req, res) => {
		try {
			const noteSub = await NoteSub.findById(req.params.idnotesub);

			if (req.user.id === noteSub.createdBy) {
				const noteSubDeleted = await NoteSub.findByIdAndDelete(req.params.id);
				// Emit event

				req.emit("DeleteNoteSub", noteSubDeleted);
				return res.send({ status: "success", message: "NoteSub deleted." });
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
module.exports = CRUDnotesSubCtrl;
