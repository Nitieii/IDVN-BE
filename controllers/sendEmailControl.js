const nodemailer = require("nodemailer");

const EmailCtrl = {
	sendEmail: async (req, res) => {
		try {
			const { to, subject, text } = req.body;
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSEMAIL,
				},
			});
			const mailOptions = await {
				from: process.env.EMAIL,
				to,
				subject,
				text,
			};

			transporter.sendMail(mailOptions, function (error, info) {
				if (error) {
					console.log(error);
					return res.send({ status: "error", message: error.message });
				} else {
					console.log("Email sent: " + info.response);
					return res.send({ status: "success", message: "sent email success" });
				}
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = EmailCtrl;
