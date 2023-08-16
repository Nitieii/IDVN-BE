const File_External = require("../models/fileExternal.model");
const File = require("../models/file.model");
const fs = require("fs");
// const { BingAIClient } = require("@waylaidwanderer/chatgpt-api");

require("dotenv").config();

const FilesExternalCtrl = {
	getFilesExternal: async (req, res) => {
		try {
			const language = req.query.language;

			let query = {};
			if (language === "en") {
				query = {
					language: "en",
				};
			} else {
				query = {
					language: "vn",
				};
			}

			const file = await File_External.find(query).sort({
				createdAt: -1,
			});

			return res.send({ status: "success", file: file });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchFilesExternal: async (req, res) => {
		try {
			const area1 = req.query.area;
			const type1 = req.query.type;
			const language = req.query.language;

			if (area1 && type1) {
				const file = await File_External.find({
					area: area1,
					type: type1,
					language: language,
				}).sort({ createdAt: -1 });

				return res.send({ status: "success", files: file });
			}

			if (!area1 && type1) {
				await File_External.find(
					{
						type: type1,
						language: language,
					},
					function (err, file) {
						if (err) {
							return res.send({ status: "error", message: err.message });
						}
						return res.send({ status: "success", file: file });
					}
				);
			}

			if (area1 && !type1) {
				await File_External.find(
					{
						area: area1,
						language: language,
					},
					function (err, file) {
						if (err) {
							return res.send({ status: "error", message: err.message });
						}
						return res.send({ status: "success", file: file });
					}
				);
			}

			if (!area1 && !type1) {
				await File_External.find({ language: language }, function (err, file) {
					if (err) {
						return res.send({ status: "error", message: err.message });
					}
					return res.send({ status: "success", file: file });
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getFileRelated: async (req, res) => {
		try {
			const fileEx = await File_External.findById(req.params.id);
			let query = {
				$and: [{ area: fileEx.area }, { type: fileEx.type }],
			};
			let output = [];
			File_External.find(query)
				.limit(5)
				.then((files) => {
					if (files && files.length && files.length > 0) {
						files.forEach((file) => {
							output.push(file);
						});
					}
					return res.send({ status: "success", files: output });
				});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getById: async (req, res) => {
		try {
			const file = await File_External.findById(req.params.id);
			return res.send({ status: "success", file: file });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	get8FilesHighest: async (req, res) => {
		try {
			const file = await File_External.find().sort({ views: -1 }).limit(8);
			return res.send({ status: "success", file: file });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteFileExternal: async (req, res) => {
		try {
			const file = await File_External.findById(req.params.id);
			if (req.user.id === file.createBy || req.user.role === "admin") {
				fs.unlinkSync(file.path);
				await File.findByIdAndDelete(req.params.id);
				file.save();
				return res.send({ status: "success", message: "delete file success" });
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

	ReadFile: async (req, res) => {
		try {
			const files = await File_External.findById(req.params.id);
			var x = files.path;
			fs.readFile(x, function (err, data) {
				res.contentType("application/pdf");
				return res.send({ status: "success", data: data });
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateFiles: async (req, res) => {
		try {
			const file = await File_External.findById(req.params.id);

			if (req.body.title) {
				file.title = req.body.title;
			}
			if (req.body.views) {
				file.views = req.body.views;
			}
			if (req.body.downloads) {
				file.downloads = req.body.downloads;
			}
			if (req.body.numShare) {
				file.numShare = req.body.numShare;
			}

			if (req.body.badges) {
				file.badges = req.body.badges;
			}
			file.save();
			return res.send({ status: "success", message: "update success" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	search: async (req, res) => {
		try {
			let { q } = req.query;
			console.log(q);
			let query = {
				$and: [
					{
						$or: [
							{ title: { $regex: `${q}`, $options: "i" } },
							{ content: { $regex: `${q}`, $options: "i" } },
						],
					},
					// {
					//   language: language,
					// },
				],
			};
			let output = [];
			if (req.body.query === "") {
				output = await File_External.find().sort({
					createdAt: -1,
				});

				return res.send({ status: "success", files: output });
			} else {
				output = await File_External.find(query);

				return res.send({ status: "success", files: output });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchReturn: async (req, res) => {
		try {
			let result = await File.aggregate();
			return res.send({
				status: "success",
				result,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	searchWithGPT: async (req, res) => {
		try {
			const { question } = req.query;

			const prompt =
				"Which areas in this array: [Arbitration, Healthcare, Construction] that this question belongs to: " +
				question +
				"?";

			const bingAIClient = new BingAIClient({
				userToken:
					"1WW9-ng66SV2jo5oN7eVw0ruO978F2vBL15VPwDVyr66OfT4qY8zYSI4nc_Vce284dXskFOhndTZFicArfny_G1-W0PbLLi7KvXHBNjmI-XssrLv7EHExakpOI9qKaLZ7nX-4E_N78wBgBAzkYiB_cYvFOxOMCc28FsrevwJxOX5CFUBqjNpm7M-SEZMCA8_E", // "_U" cookie from bing.com
				debug: false,
			});

			let response = await bingAIClient.sendMessage(prompt, {
				onProgress: (token) => {
					process.stdout.write(token);
				},
			});

			console.log(response);

			return res.send({
				status: "success",
				result: response,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = FilesExternalCtrl;
