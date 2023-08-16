const New = require("../../models/new/new.model");

const moment = require("moment");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const CRUDNewCtrl = {
	getNews: async (_req, res) => {
		try {
			const news = await New.find().sort({ createdAt: -1 }).limit(10);
			const result = [];
			for (let i = 0; i < news.length; i++) {
				const obj = {
					id: news[i].id,
					title: news[i].title,
					html: news[i].html,
					banner_url: news[i].banner_url,
					createdAt: news[i].createdAt,
				};
				result.push(obj);
			}
			return res.send({ status: "success", news: result });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getNewById: async (req, res) => {
		try {
			const aNew = await New.findById(req.params.id);
			return res.send({ status: "success", new: aNew });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getNewRelated: async (req, res) => {
		try {
			const news = await New.find({ _id: { $ne: req.params.id } })
				.sort({ createdAt: -1 })
				.limit(3);
			return res.send({ status: "success", new: news });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addNew: async (req, res) => {
		try {
			// const { uploadBanner } = require("./upload_banner");
			const { title, html, banner_url } = req.body;
			const newCreated = await New.create({
				title,
				banner_url,
				html,
				createdAt: moment().format(),
				createdBy: req.user.id,
			});
			// const file = req.file;
			// const result = await uploadBanner(file);
			// await unlinkFile(file.path);
			// newCreated.banner_url = result.Location;
			newCreated.save();
			return res.send({ status: "success", new: newCreated });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [
					{ title: { $regex: `${q}`, $options: "i" } },
					{ html: { $regex: `${q}`, $options: "i" } },
				],
			};
			let output = [];
			if (req.body.query === "") {
				const news = await New.find();
				return res.send({ status: "success", news: news });
			} else {
				New.find(query)
					.limit(10)
					.then((news) => {
						if (news && news.length && news.length > 0) {
							news.forEach((newEach) => {
								output.push(newEach);
							});
						}
						return res.send({ status: "success", files: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	upImg: async (req, res) => {
		try {
			const newUpdate = await New.findById(req.params.id);
			const { uploadBanner } = require("./upload_banner");
			const file = req.file;
			const result = await uploadBanner(file);
			await unlinkFile(file.path);
			newUpdate.banner_url = result.Location;
			newUpdate.save();
			return res.send({ status: "success", message: "upload success" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNew: async (req, res) => {
		try {
			const newEdit = await New.findById(req.params.id);
			if (req.user.id == newEdit.createdBy || req.user.role === "admin") {
				if (req.body.title) {
					newEdit.title = req.body.title;
				}
				if (req.body.html) {
					newEdit.html = req.body.html;
				}
				newEdit.save();
				return res.send({
					status: "success",
					message: "update success!",
					newEdit: newEdit,
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

	deleteNew: async (req, res) => {
		try {
			const newDeleted = await New.findById(req.params.id);
			if (req.user.id == newDeleted.createdBy || req.user.role === "admin") {
				await New.findByIdAndDelete(req.params.id);
				return res.send({
					status: "success",
					message: "Comment deleted successfully",
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
};
module.exports = CRUDNewCtrl;
