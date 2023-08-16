const File = require("../../models/file.model");
const Matter = require("../../models/matter/matter.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const fs = require("fs");

// const client = redis.createClient(REDIS_PORT);

const DocumentCtrl = {
	getDocuments: async (req, res) => {
		const documentOfMatter = [];

		try {
			const document = await File.find();
			for (let i = 0; i < document.length; i++) {
				if (req.params.idmatter == document[i].matterId) {
					documentOfMatter.push(document[i]);
				}
			}
			return res.send({ status: "success", documents: documentOfMatter });
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
			if (req.body.query === "") {
				const document = await File.find();
				const documentArr = [];
				for (let i = 0; i < document.length; i++) {
					if (document[i].matterId == req.params.idmatter) {
						documentArr.push(document[i]);
					}
				}
				return res.send({ status: "success", documents: documentArr });
			} else {
				File.find(query)
					.limit(6)
					.then((documents) => {
						console.log(documents.taskId);
						if (documents && documents.length && documents.length > 0) {
							documents.forEach((document) => {
								if (document.matterId === req.params.idmatter) {
									let obj = {
										title: document.title,
										path: document.path,
									};
									output.push(obj);
								}
							});
						}
						return res.send({ status: "success", documents: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	downloadDocument: async (req, res) => {
		try {
			const document = await File.findById(req.params.iddocument);
			var x = document.path;
			res.download(x);
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteDocument: async (req, res) => {
		try {
			const document = await File.findById(req.params.iddocument);
			console.log("document: ", document);
			if (req.user.id == document.createBy) {
				await fs.unlinkSync(document.path);
				document.save();
				const matter = await Matter.findById(req.params.idmatter);
				const documentOfMatter = matter.document;
				const documentindex = documentOfMatter.indexOf(req.params.iddocument);
				documentOfMatter.splice(documentindex, 1);
				matter.save();
				const document = await File.findByIdAndDelete(req.params.iddocument);
				return res.send({
					status: "success",
					message: "delete document success",
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

	ReadDocument: async (req, res) => {
		try {
			const document = await File.findById(req.params.iddocument);
			var x = document.path;
			fs.readFile(x, function (err, data) {
				res.contentType("application/pdf");
				res.status(200).send({ data: data });
				return res.send({ status: "success", data: data });
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateDocument: async (req, res) => {
		try {
			const document = await File.findById(req.params.iddocument);

			if (req.user.id === document.createBy) {
				if (req.body.title) {
					document.title = req.body.title;
				}

				document.save();
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
module.exports = DocumentCtrl;
