const nodemailer = require("nodemailer");

require("dotenv").config("../.env");

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		type: "OAuth2",
		user: process.env.EMAIL,
		clientId: process.env.GOOGLE_MAILER_CLIENT_ID,
		clientSecret: process.env.GOOGLE_MAILER_CLIENT_SECRET,
		refreshToken: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
	},
});

module.exports = transporter.sendMail.bind(transporter);
