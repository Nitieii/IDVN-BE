const Note = require("../../models/note.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const SearchNoteCtrl = {
	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [
					{ title: { $regex: `${q}`, $options: "i" } },
					{ description: { $regex: `${q}`, $options: "i" } },
				],
			};
			let output = [];
			if (req.body.query === "") {
				const notes = await Note.find();
				const noteArr = [];
				for (let i = 0; i < notes.length; i++) {
					if (notes[i].taskId == req.params.idtask) {
						noteArr.push(notes[i]);
					}
				}
				return res.send({ status: "success", notes: noteArr });
			} else {
				Note.find(query)
					.limit(6)
					.then((notes) => {
						if (notes && notes.length && notes.length > 0) {
							notes.forEach((note) => {
								if (note.taskId == req.params.idtask) {
									let obj = {
										title: note.title,
										description: note.description,
									};
									output.push(obj);
								}
							});
						}
						return res.send({ status: "success", notes: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = SearchNoteCtrl;
