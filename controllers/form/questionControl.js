const Form = require("../../models/form/form.model");

const Question = require("../../models/form/question.model");
const moment = require("moment");

// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const questionCtrl = {
	getQuestion: async (req, res) => {
		try {
			const form = await Form.findById(req.params.idform);
			const questionOfForm = form.questions;
			const questionArr = [];
			for (let i = 0; i < questionOfForm.length; i++) {
				const question = await Question.findById(questionOfForm[i]);
				questionArr.push(question);
			}
			return res.send({ status: "success", questions: questionArr });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getQuestionById: async (req, res) => {
		try {
			const question = await Question.findById(req.params.idquestion);
			return res.send({ status: "success", question: question });
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
			let questionArr = [];
			if (req.body.query === "") {
				const question = await Question.find();
				for (let i = 0; i < question.length; i++) {
					if (question[i].formId === req.params.idform) {
						questionArr.push(question[i]);
					}
				}
				return res.send({ status: "success", question: questionArr });
			} else {
				Question.find(query)
					.limit(6)
					.then((questions) => {
						if (questions && questions.length && questions.length > 0) {
							questions.forEach((question) => {
								if (question.formId === req.params.idform) {
									let obj = {
										title: question.title,
									};
									output.push(obj);
								}
							});
						}
						return res.send({ status: "success", question: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addQuestion: async (req, res) => {
		if (req.user.role === "guest") {
			console.log("Account does not have this permission");
			return res.send({
				status: "error",
				message: "Account does not this permission",
			});
		} else {
			const { title } = req.body;
			try {
				const questionCreate = await Question.create({
					title,
					createBy: req.user.id,
					formId: req.params.idform,
					createdAt: moment().format(),
				});
				questionCreate.save();
				const form = await Form.findById(req.params.idform);
				const QuestionOfForm = form.questions;
				QuestionOfForm.push(questionCreate);
				form.save();
				console.log("Question added successfully: ", questionCreate);
				// Emit event
				req.emit("Addquestion", questionCreate);
				return res.send({ status: "success", question: questionCreate });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		}
	},

	updateQuestion: async (req, res) => {
		try {
			const question = await Question.findById(req.params.idquestion);
			if (req.user.id == question.createBy) {
				if (req.body.title) {
					question.title = req.body.title;
				}
				question.save();
				// Emit event
				req.emit("questionUpdated", question);
				return res.send({
					status: "success",
					message: "Question title successfully",
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

	deleteQuestion: async (req, res) => {
		const question = await Question.findById(req.params.idquestion);
		try {
			if (req.user.role == "admin" || req.user.id === question.createBy) {
				const questionDeleted = await Question.findByIdAndDelete(
					req.params.idquestion
				);

				// delte question in form
				const form = await Form.findById(req.params.idform);
				const questionArray = form.questions;
				const deletedQuestionIndex = questionArray.indexOf(
					req.params.idquestion
				);
				questionArray.splice(deletedQuestionIndex, 1);
				form.save();

				// Emit event
				req.emit("Deletequestion", questionDeleted);
				return res.send({ status: "success", message: "Question deleted." });
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
module.exports = questionCtrl;
