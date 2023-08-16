const Image = require("../models/image.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
const webpush = require("web-push");
require("dotenv").config();

// const client = redis.createClient(REDIS_PORT);

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

const sendNotificationCtrl = {
	getImage: async (req, res) => {
		webpush.setVapidDetails(
			"mailto:camtu29082000@gmail.com",
			publicVapidKey,
			privateVapidKey
		);
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
};
module.exports = sendNotificationCtrl;
