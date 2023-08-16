const File = require("../../models/file.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const path = require("path");
const fs = require("fs");

// const client = redis.createClient(REDIS_PORT);

const FilesCtrl = {
	getFiles: async (req, res) => {
		const fileOfPerson = [];
		try {
			const files = await File.find();

			for (let i = 0; i < files.length; i++) {
				const sharedPersonOfFile = files[i].sharedPerson;
				if (req.user.id === files[i].createBy) {
					fileOfPerson.push(files[i]);
				} else {
					for (let j = 0; j < sharedPersonOfFile.length; j++) {
						if (req.user.id === sharedPersonOfFile[j]) {
							fileOfPerson.push(files[i]);
						}
					}
				}
			}
			return res.send({ status: "success", files: fileOfPerson });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	downloadFile: async (req, res) => {
		try {
			const files = await File.findById(req.params.id);
			var x = files.path;
			res.download(x);
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteFile: async (req, res) => {
		try {
			const file = await File.findById(req.params.id);
			if (req.user.id === file.createBy) {
				console.log("file: ", file.path);
				await fs.unlinkSync(file.path);
				await File.findByIdAndDelete(req.params.id);

				file.save();
				return res.send({ status: "success", message: "delete file success" });
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not this permission",
				});
			}
		} catch (err) {
			res.status(400).send(err);
		}
	},

	ReadFile: async (req, res) => {
		try {
			const files = await File.findById(req.params.id);
			var x = files.path;
			fs.readFile(x, function (err, data) {
				res.contentType("application/pdf");
				res.send(data);
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateFiles: async (req, res) => {
		try {
			const file = await File.findById(req.params.id);

			if (req.user.id === file.createBy) {
				file.title = req.body.title;
				const newShared = req.body.sharedPerson;
				console.log(newShared);

				file.save();
				const sharedPerson = file.sharedPerson;
				sharedPerson.push(newShared);
				const ParentFolder = path.join(__dirname, "../files/internal/");
				for (let i = 0; i < sharedPerson.length; i++) {
					console.log("hereeee: ", sharedPerson[i]);
					const pathToFile = file.path;
					const pathToNewDestination = path.join(
						ParentFolder,
						sharedPerson[i],
						file.title
					);
					fs.copyFileSync(pathToFile, pathToNewDestination);
				}
				return res.send({ status: "success", message: "update success" });
			} else {
				return res.send({
					status: "error",
					message: "Account does not this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = FilesCtrl;
