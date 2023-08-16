const Image = require("../models/image.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const fs = require("fs");

// const client = redis.createClient(REDIS_PORT);

const ImgCtrl = {
	getImage: async (req, res) => {
		try {
			const img = await Image.find();
			for (let i = 0; i < img.length; i++) {
				if (req.params.iduser === img[i].userId) {
					// client.set(redisname, JSON.stringify(img[i]));
					return res.send({ status: "success", img: img[i] });
				}
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	downloadImg: async (req, res) => {
		try {
			const img = await Image.findById(req.params.idimg);
			var x = img.path;
			res.download(x);
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteImg: async (req, res) => {
		try {
			const img = await Image.findById(req.params.idimg);
			if (req.user.id === img.userId) {
				console.log("taskfile: ", img.path);
				await fs.promises.unlink(img.path);
				img.save();
				return res.send({ status: "success", message: "delete img success" });
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
module.exports = ImgCtrl;
