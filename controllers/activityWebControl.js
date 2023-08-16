const ActivityWeb = require("../models/activityWeb.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
// const client = redis.createClient(REDIS_PORT);

const ActivitiyWebCtrl = {
	getActivitiyWeb: async (req, res) => {
		try {
			const activityWeb = await ActivityWeb.find();
			return res.send({ status: "success", activityWeb: activityWeb });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = ActivitiyWebCtrl;
