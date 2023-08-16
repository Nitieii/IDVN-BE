const Note = require("../../models/note.model");
const Matter = require("../../models/matter/matter.model");
const Timesheet = require("../../models/matter/timesheet.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const moment = require("moment");
const { default: mongoose } = require("mongoose");
// const client = redis.createClient(REDIS_PORT);

const CRUDnotesCtrl = {
	getNotes: async (req, res) => {
		const arrayNote = [];
		try {
			const notes = await Note.find();
			for (let i = 0; i < notes.length; i++) {
				if (notes[i].matterId === req.params.matterId) {
					arrayNote.push(notes[i]);
				}
			}
			const arrayNoteAfterSort = arrayNote.sort(function (a, b) {
				return new Date(b.createdAt) - new Date(a.createdAt);
			});
			return res.send({ status: "success", notes: arrayNoteAfterSort });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getDuplicateMatter: async (req, res) => {
		try {
			// find matter that has	the same matter code
			// const duplicateCode = await Matter.aggregate([
			// 	{
			// 		$group: {
			// 			_id: "$matterCode",
			// 			count: { $sum: 1 },
			// 		},
			// 	},
			// 	{
			// 		$match: {
			// 			count: { $gt: 1 },
			// 		},
			// 	},
			// ]);

			// Update matter id for all of the duplicate timesheet
			const timesheets = await Timesheet.updateMany(
				{
					matterCode: "EL_2022_LN_184",
					matterName: "MRB CP01",
				},
				{
					$set: {
						matterId: "6343f8e20f81a0626dfff444",
					},
				}
			);

			const timesheetsDup = await Timesheet.find({
				matterCode: "EL_2022_LN_184",
				matterName: "MRB CP01",
			});

			// convert to	array of string instead of object
			const duplicateCodeString = timesheetsDup.map((item) =>
				item._id.toString()
			);

			const matter = await Matter.updateOne(
				{
					matterName: "MRB CP01",
				},
				{
					$set: {
						timesheet: duplicateCodeString,
					},
				}
			);

			// remove timeshet id that got duplicate from timehsheet array of matter
			await Matter.updateOne(
				{
					matterName: "VEC Halla A1",
				},
				{
					$pull: {
						timesheet: {
							$in: duplicateCodeString,
						},
					},
				}
			);

			return res.send({ status: "success", timesheets: duplicateCodeString });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addnotes: async (req, res) => {
		const { description } = req.body;
		try {
			const note = await Note.create({
				matterId: req.params.matterId,
				userId: req.user.id,
				// title,
				description,
				userImg: req.user.image_url,
				userName: req.user.fullname,
				createdAt: moment().format(),
			});
			note.save();
			const matter = await Matter.findById(req.params.matterId);
			console.log("matter: ", matter);
			const noteOfMatter = matter.notes;
			noteOfMatter.push(note);
			console.log("Note added successfully: ", note);
			matter.save();
			// Emit event

			req.emit("AddNoteMatter", note);
			return res.send({ status: "success", notes: note });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNotes: async (req, res) => {
		try {
			const note = await Note.findById(req.params.idnote);
			if (req.user.id === note.userId) {
				if (req.body.title) {
					note.title = req.body.title;
				}
				if (req.body.description) {
					note.description = req.body.description;
				}
				note.save();
				// const notes = await Note.find();
				// for (let i = 0; i < notes.length; i++) {
				//   if (notes[i].taskId === req.params.idtask) {
				//     arrayNote.push(notes[i]);
				//   }
				// }
				// Emit event

				req.emit("UpdateNoteMatter", note);
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
			const note = await Note.findById(req.params.idnote);

			if (req.user.id === note.userId) {
				const noteDeleted = await Note.findByIdAndDelete(req.params.idnote);
				const matter = await Matter.findById(req.params.matterId);
				const noteOfMatter = matter.notes;
				const noteindex = noteOfMatter.indexOf(req.params.idnote);
				noteOfMatter.splice(noteindex, 1);
				matter.save();
				// Emit event

				req.emit("DeleteNoteMatter", noteDeleted);
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
module.exports = CRUDnotesCtrl;
