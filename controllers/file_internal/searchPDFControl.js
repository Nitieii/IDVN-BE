const File = require("../../models/file.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const SearchCtrl = {
	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [{ title: { $regex: `${q}`, $options: "i" } }],
			};
			let output = [];
			let fileArr = [];
			if (req.body.query === "") {
				const file = await File.find();
				for (let i = 0; i < file.length; i++) {
					fileArr.push(file[i]);
				}
				return res.send({ status: "success", files: fileArr });
			} else {
				File.find(query)
					.limit(6)
					.then((files) => {
						if (files && files.length && files.length > 0) {
							files.forEach((file) => {
								let obj = {
									title: file.title,
									path: file.path,
								};
								output.push(obj);
							});
						}
						return res.send({ status: "success", files: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = SearchCtrl;
