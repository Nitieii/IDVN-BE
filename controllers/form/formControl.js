const Form = require("../../models/form/form.model");

const moment = require("moment");

// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

const formCtrl = {
	getForm: async (req, res) => {
		try {
			const form = await Form.find();
			return res.send({ status: "success", forms: form });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getFormById: async (req, res) => {
		try {
			const form = await Form.findById(req.params.id);
			return res.send({ status: "success", form: form });
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
			let formArr = [];
			if (req.body.query === "") {
				const form = await Form.find();
				for (let i = 0; i < form.length; i++) {
					formArr.push(form[i]);
				}
				return res.send({ status: "success", forms: formArr });
			} else {
				Form.find(query)
					.limit(6)
					.then((forms) => {
						if (forms && forms.length && forms.length > 0) {
							forms.forEach((form) => {
								let obj = {
									title: form.title,
								};
								output.push(obj);
							});
						}
						return res.send({ status: "success", forms: output });
					});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addForm: async (req, res) => {
		if (req.user.role === "guest") {
			console.log("Account does not have this permission");
			return res.send({
				status: "error",
				message: "Account does not have this permission",
			});
		} else {
			const { title } = req.body;
			try {
				const formCreate = await Form.create({
					title,
					createBy: req.user.id,
					createdAt: moment().format(),
				});
				formCreate.save();
				console.log("Form added successfully: ", formCreate);

				// Emit event
				req.emit("Addform", formCreate);
				return res.send({ status: "success", form: formCreate });
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		}
	},

	updateForm: async (req, res) => {
		try {
			const form = await Form.findById(req.params.id);
			if (req.user.id == form.createBy) {
				if (req.body.title) {
					form.title = req.body.title;
				}
				form.save();
				// Emit event
				req.emit("formUpdated", form);
				return res.send({
					status: "success",
					message: "Form title successfully",
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

	deleteForm: async (req, res) => {
		const form = await Form.findById(req.params.id);
		try {
			if (req.user.role == "admin" || req.user.id === form.createBy) {
				const formDeleted = await Form.findByIdAndDelete(req.params.id);

				// Emit event
				req.emit("Deleteform", formDeleted);
				return res.send({ status: "success", message: "Form deleted." });
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
module.exports = formCtrl;
