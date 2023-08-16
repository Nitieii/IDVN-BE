const CheckList = require("../../models/project/checklist.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const SearchCheckListCtrl = {
	search: async (req, res) => {
		try {
			let q = req.body.query;
			let query = {
				$or: [{ content: { $regex: `${q}`, $options: "i" } }],
			};
			let output = [];
			if (req.body.query === "") {
				const checklist = await CheckList.find();
				const checklistArr = [];
				for (let i = 0; i < checklist.length; i++) {
					if (checklist[i].taskId == req.params.idtask) {
						checklistArr.push(checklist[i]);
					}
				}
				return res.send({ status: "success", checklists: checklistArr });
			} else {
				CheckList.find(query)
					.limit(6)
					.then((checklists) => {
						if (checklists && checklists.length && checklists.length > 0) {
							checklists.forEach((checklist) => {
								if (checklist.taskId == req.params.idtask) {
									let obj = {
										content: checklist.content,
									};
									output.push(obj);
								}
							});
						}
						return res.send({ status: "success", checklists: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = SearchCheckListCtrl;
