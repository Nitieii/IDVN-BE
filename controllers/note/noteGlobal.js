const NoteGlobal = require("../../models/note/noteGlobal.model");
const moment = require("moment");

const CRUDnotesGlobalCtrl = {
	getNotes: async (req, res) => {
		try {
			const notes = await NoteGlobal.find();
			const noteAfterSort = notes.sort(function (a, b) {
				return new Date(b.createdAt) - new Date(a.createdAt);
			});
			return res.send({ status: "success", notes: noteAfterSort });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getNoteById: async (req, res) => {
		try {
			const notes = await NoteGlobal.findById(req.params.id);
			const memberOfTeam = notes.teamMembers;
			if (memberOfTeam.includes(req.user.id)) {
				return res.send({ status: "success", notes: notes });
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

	addnotes: async (req, res) => {
		const { title, teamMembers } = req.body;
		try {
			const note = await NoteGlobal.create({
				createdBy: req.user.id,
				userImg: req.user.image_url,
				createdByName: req.user.fullname,
				title,
				teamMembers,
				createdAt: moment().format(),
			});
			note.save();
			// Emit event

			req.emit("AddNoteGlobal", note);
			return res.send({ status: "success", notes: note });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNotes: async (req, res) => {
		try {
			const note = await NoteGlobal.findById(req.params.id);
			if (
				req.user.id === note.createdBy ||
				req.user.role === "admin" ||
				req.user.role === "partner"
			) {
				if (req.body.title) {
					note.title = req.body.title;
				}
				if (req.body.teamMembers) {
					note.teamMembers = req.body.teamMembers;
				}
				note.save();
				// Emit event

				req.emit("noteGlobalUpdated", note);
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

	deleteNotes: async (req, res) => {
		try {
			const note = await NoteGlobal.findById(req.params.id);

			if (
				req.user.id === note.createdBy ||
				req.user.role === "admin" ||
				req.user.role === "partner"
			) {
				const noteDeleted = await NoteGlobal.findByIdAndDelete(req.params.id);
				// Emit event

				req.emit("DeleteNoteGlobal", noteDeleted);
				return res.send({ status: "success", message: "Note deleted." });
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
module.exports = CRUDnotesGlobalCtrl;
