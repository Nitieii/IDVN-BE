const Question = require("../../models/form/question.model");

const Option = require("../../models/form/option.model");
const moment = require("moment");

// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const optionCtrl = {
	getOption: async (req, res) => {
		try {
			const question = await Question.findById(req.params.idquestion);
			const optionOfQuestion = question.options;
			const optionArr = [];
			for (let i = 0; i < optionOfQuestion.length; i++) {
				const option = await Option.findById(optionOfQuestion[i]);
				optionArr.push(option);
			}
			return res.send({ status: "success", options: optionArr });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getOptionById: async (req, res) => {
		try {
			const option = await Option.findById(req.params.idoption);
			return res.send({ status: "success", option: option });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addOption: async (req, res) => {
		if (req.user.role === "guest") {
			console.log("Account does not have this permission");
			return res.send({
				status: "error",
				message: "Account does not this permission",
			});
		} else {
			const { title, content } = req.body;
			try {
				const optionCreate = await Option.create({
					title,
					content,
					createBy: req.user.id,
					questionId: req.params.idquestion,
					createdAt: moment().format(),
				});
				optionCreate.save();
				const question = await Question.findById(req.params.idquestion);
				const optionOfQuestion = question.options;
				optionOfQuestion.push(optionCreate);
				question.save();
				console.log("Option added successfully: ", optionCreate);

				// Emit event
				req.emit("Addoption", optionCreate);
				return res.send({ status: "success", option: optionCreate });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		}
	},

	updateOption: async (req, res) => {
		try {
			const option = await Option.findById(req.params.idoption);
			if (req.user.id == option.createBy) {
				if (req.body.title) {
					option.title = req.body.title;
				}
				if (req.body.content) {
					option.content = req.body.content;
				}
				option.save();
				// Emit event
				req.emit("optionUpdated", option);
				return res.send({
					status: "success",
					message: "Option updated successfully",
				});
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteOption: async (req, res) => {
		const option = await Option.findById(req.params.idoption);
		try {
			if (req.user.role == "admin" || req.user.id === option.createBy) {
				const optionDeleted = await Option.findByIdAndDelete(
					req.params.idoption
				);

				// delte option in question
				const question = await Question.findById(req.params.idquestion);
				const optionArray = question.options;
				const deletedOptionIndex = optionArray.indexOf(req.params.idoption);
				optionArray.splice(deletedOptionIndex, 1);
				question.save();

				// Emit event
				req.emit("Deleteoption", optionDeleted);
				return res.send({ status: "success", message: "Option deleted." });
			} else {
				console.log("Account does not have this permission");
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
module.exports = optionCtrl;
