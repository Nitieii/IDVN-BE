const moment = require("moment");
const TimeOff = require("../models/timeOff/timeOff.model");

const CRUDtimeOffCtrl = {
	getTimeOff: async (req, res) => {
		try {
			const { date1, date2 } = req.query;

			const timeOffs = await TimeOff.find({
				start: {
					$gte: moment(date1).format("YYYY-MM-DD"),
					$lte: moment(date2).format("YYYY-MM-DD"),
				},
			});

			return res.send({ status: "success", timeOffs: timeOffs });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	createTimeOff: async (req, res) => {
		try {
			if (
				req.user.role == "admin" ||
				req.user.role == "employee" ||
				req.user.role == "partner"
			) {
				let { title, start, end, duration } = req.body;

				const date1 = moment(start).format("YYYY-MM-DD");
				const date2 = moment(end).format("YYYY-MM-DD");

				start = moment(date1);
				end = moment(date2);

				let daysDuration;
				if (!duration) {
					const differ = end.diff(start, "days") + 1;
					daysDuration = differ;
				} else {
					daysDuration = duration;
				}

				const newTimeOff = await TimeOff.create({
					title,
					start: date1,
					end: date2,
					duration: daysDuration,
				});

				newTimeOff.save();

				return res.send({ status: "success", timeOff: newTimeOff });
			} else {
				return res.send({
					status: "error",
					message: "User does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	editTimeOff: async (req, res) => {
		try {
			if (
				req.user.role == "admin" ||
				req.user.role == "employee" ||
				req.user.role == "partner"
			) {
				const timeOff = await TimeOff.findById(req.params.id);

				if (!timeOff) {
					return res.send({
						status: "error",
						message: "Time Off Id does not exist",
					});
				}

				const { title, start, end, duration } = req.body;

				if (title) {
					timeOff.employee = title;
				}

				if (start) {
					timeOff.start = moment(start).format("YYYY-MM-DD");
				}

				if (end) {
					timeOff.end = moment(end).format("YYYY-MM-DD");
				}

				if (duration) {
					timeOff.duration = duration;
				}

				timeOff.save();

				return res.send({
					status: "success",
					message: "Update successfully",
					timeOff: timeOff,
				});
			} else {
				return res.send({
					status: "error",
					message: "User does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteTimeOff: async (req, res) => {
		try {
			if (
				req.user.role == "admin" ||
				req.user.role == "partner" ||
				req.user.role == "employee"
			) {
				const deleteTimeOff = await TimeOff.findById(req.params.id);

				if (!deleteTimeOff) {
					return res.send({
						status: "error",
						message: "Time Off Id does not exist",
					});
				}

				await TimeOff.findByIdAndDelete(req.params.id);

				return res.send({
					status: "success",
					message: "Delete time off successfully",
				});
			} else {
				return res.send({
					status: "error",
					message: "User does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};

module.exports = CRUDtimeOffCtrl;
