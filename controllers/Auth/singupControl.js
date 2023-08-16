const argon2 = require("argon2");
const { User, Team } = require("#models");
const { catchAsync } = require("#utils");

const nodemailer = require("nodemailer");

// defined account gmail
const transporter = nodemailer.createTransport({
	host: "smtp-mail.outlook.com",
	secureConnection: false,
	port: 587,
	auth: {
		user: process.env.EMAIL,
		pass: process.env.PASSEMAIL,
	},
	tls: {
		ciphers: "SSLv3",
	},
});

// Register User
const singupCtrl = {
	Signup: catchAsync(async (req, res) => {
		// Hash password
		const {
			fullname,
			email,
			password: plainTextPassword,
			companyName,
			phonenumber,
			companyRole,
			image_url,
			useCases,
			country,
			province,
		} = req.body;
		const password = await argon2.hash(plainTextPassword);

		const checkUser = await User.findOne({ email });
		if (checkUser) throw new Error("Email is already in use");

		const colors = [
			"#588B8B",
			"#FFD5C2",
			"#F28F3B",
			"#CA3636",
			"#2d3047",
			"#00579d",
			"#d37764",
			"#5d7a48",
			"#f0bc3a",
			"#bd9c7f",
			"#94986c",
			"#b897bb",
		];

		function getRandomNum(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		const chosenColor = colors[getRandomNum(0, colors.length - 1)];
		const user = await User.create({
			fullname,
			email,
			password,
			companyName,
			phonenumber,
			role: "user",
			companyRole,
			image_url,
			country,
			province,
			useCases,
			backgroundColor: chosenColor,
		});

		user.save();
		const verificationToken = user.generateVerificationToken();

		// Email the user a unique verification link
		const url = `https://d392hd1u5yd463.cloudfront.net/api/verify/${verificationToken}`;
		transporter.sendMail({
			to: req.body.email,
			subject: "Verify Account",
			html: `Click <a href = '${url}'>here</a> to confirm your email.`,
		});
		return res.send({
			status: "success",
			message: `Sent a verification email to ${email}`,
		});

		// res.json({ msg: "User account created successfully", user: User });
	}),

	addClient: async (req, res) => {
		let {
			fullname,
			email,
			password: plainTextPassword,
			companyName,
			phonenumber,
			role,
			country,
			province,
			team,
		} = req.body;

		function getRandomNum(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		try {
			const checkUser = await User.findOne({ email });
			if (checkUser) {
				return res.send({
					status: "error",
					message: "Email is already in use",
				});
			}

			if (email == "0") {
				email = "";
			}

			if (plainTextPassword == "0") {
				plainTextPassword = "123";
			}

			if (role == "admin" || role == "employee" || role == "partner") {
				if (!team) {
					team = "61dc1589b87e95e64d4caee5";
				} else {
					const tea = await Team.findOne({ partner: team });
					team = tea._id;
				}
			}

			const password = await argon2.hash(plainTextPassword);

			const colors = [
				"#588B8B",
				"#FFD5C2",
				"#F28F3B",
				"#CA3636",
				"#2d3047",
				"#00579d",
				"#d37764",
				"#5d7a48",
				"#f0bc3a",
				"#bd9c7f",
				"#94986c",
				"#b897bb",
				"#7D5A50",
				"#5E8B7E",
				"#9F5F80",
				"#7D5A50",
				"#4B6587",
				"#B67171",
			];

			const chosenColor = colors[getRandomNum(0, colors.length - 1)];

			const user = await User.create({
				fullname,
				email,
				password,
				companyName,
				phonenumber,
				role,
				country,
				province,
				team,
				verified: true,
				backgroundColor: chosenColor,
			});

			user.save();

			await Team.findByIdAndUpdate(team, {
				$push: {
					members: user._id,
				},
			});

			return res.send({
				status: "success",
				message: "Create client successfully",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getUser: async (req, res) => {
		try {
			const users = await User.find();
			return res.send({ status: "succes", users: users });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateAllUserPassword: async (req, res) => {
		try {
			if (req.user.role == "admin") {
				const newpassword = "lntpartners123@";

				const password = await argon2.hash(newpassword);

				await User.updateMany({ $set: { password: password } });

				return res.send({ status: "success" });
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
module.exports = singupCtrl;
