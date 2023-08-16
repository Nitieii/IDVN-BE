// const redis = require("redis");
// const REDIS_PORT = process.env.PORT || 6379;
// const client = redis.createClient(REDIS_PORT);
const path = require("path");
const bcrypt = require("bcryptjs");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const { User, LoginHistory } = require("#models");
const { catchAsync } = require("#utils");
const config = require("#configs/config");
const { sendMail } = require("#utils");
const ejs = require("ejs");
var geoip = require("geoip-lite");

let Tokens = [];
// Register User
const loginCtrl = {
	Login: catchAsync(async (req, res) => {
		const { email, password } = req.body;
		// lean() return a very json simple object representation
		// const user = await User.findOne({ email }).lean()
		const user = await User.findOne({ email });

		if (!user) throw new Error("Invalid email/password");

		// Ensure the account has been verified
		if (!user.verified) throw new Error("Verify your account first");

		if (user.password.startsWith("$2")) {
			if (!(await bcrypt.compare(password, user.password))) {
				const loginHistory = new LoginHistory({
					userId: user.id,
					loginTime: new Date(),
					ipAddress:
						req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
					userAgent: req.headers["user-agent"],
					status: "failure",
				});

				await loginHistory.save();

				throw new Error("Invalid email/password");
			}

			user.password = await argon2.hash(password);
		} else {
			if (!(await argon2.verify(user.password, password))) {
				const loginHistory = new LoginHistory({
					userId: user.id,
					loginTime: new Date(),
					ipAddress:
						req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
					userAgent: req.headers["user-agent"],
					status: "failure",
				});

				await loginHistory.save();

				const check = await checkUnusualLogin(req, user.id);

				if (check) {
					let html;

					if (typeof check === "object") {
						html = await ejs.renderFile(
							path.join(__dirname, "..", "..", "emails", "unusualLogin.ejs"),
							{
								name: user.fullname,
								location: check.city + ", " + check.country,
								time: new Date(),
							}
						);
					} else if (check === true) {
						html = await ejs.renderFile(
							path.join(__dirname, "..", "..", "emails", "unusualLogin.ejs"),
							{
								name: user.fullname,
								location: "Unknown",
								time: new Date(),
							}
						);
					}

					await sendMail({
						to: "tuananhngo2513@gmail.com",
						subject: "Alert Unusual Login Activity",
						html: html,
					});
				}

				throw new Error("Invalid email/password");
			}
		}

		const token = jwt.sign({ id: user.id }, config.TOKEN.ACCESS_TOKEN_SECRET, {
			expiresIn: "365d",
		});

		const userInfor = {
			role: user.role,
			projects: user.projects,
			id: user.id,
			fullname: user.fullname,
			email: user.email,
			image_url: user.image_url,
			team: user.team,
		};
		Tokens.push(token);
		user.save();

		const loginHistory = new LoginHistory({
			userId: user.id,
			loginTime: new Date(),
			ipAddress:
				req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
			userAgent: req.headers["user-agent"],
			status: "success",
		});

		await loginHistory.save();

		return res.send({ status: "success", data: token, user: userInfor });
	}),

	verify: async (req, res) => {
		const tokena = JSON.stringify(req.params.id);
		const token = tokena.split('"')[1];
		// Check we have an id

		if (!token) {
			res.sendFile(path.join(__dirname + "../../../verifyError.html"));
		}
		// Step 1 -  Verify the token from the URL
		let payload = null;
		try {
			payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
		try {
			// Step 2 - Find user with matching ID
			const user = await User.findOne({ _id: payload.id }).exec();
			if (!user) {
				return res.send({ status: "error", message: "User does not  exists" });
			}
			// Step 3 - Update user verification status to true
			user.verified = true;
			await user.save();
			res.sendFile(path.join(__dirname + "../../../verify.html"));
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	Logout: async (req, res) => {
		Tokens = Tokens.filter((token) => token !== req.body.token);
		return res.status(204);
	},

	resetPassword: catchAsync(async (req, res) => {
		const { token } = req.params;

		const { password } = req.body;

		const decoded = jwt.verify(token, config.TOKEN.RESET_PASSWORD_TOKEN_SECRET);

		const user = await User.findById(decoded.id);

		if (!user) throw new Error("Invalid token");

		user.password = await argon2.hash(password);

		await user.save();

		// Log user out of all devices
		Tokens = Tokens.filter((token) => token !== req.body.token);

		return res.send({ status: "success" });
	}),

	AlertLoginActity: catchAsync(async (req, res) => {
		const { fullname } = req.user;

		// Format date in dd/mm/yyyy format
		const date = new Date().toLocaleDateString("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});

		// Format time in 24-hour format
		const time = new Date().toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "numeric",
		});

		const html = await ejs.renderFile(
			path.join(__dirname, "..", "..", "emails", "userLoggedIn.ejs"),
			{
				user: fullname,
				date: date,
				time: time,
			}
		);

		await sendMail({
			to: "tuananhngo2513@gmail.com",
			subject: "User New Logged In",
			html: html,
		});

		return res.send({ status: "success" });
	}),
};

const checkUnusualLogin = async (req, userId) => {
	const attempts = await LoginHistory.find({ userId });

	// Check if there are outsiders trying to attempts logging in, under 10 minutes and status	is failure more than 3 times
	const fiveMinutesAgo = Date.now() - 10 * 60 * 1000;

	const unusualAttempts = attempts.filter(
		(attempt) =>
			new Date(attempt.createdAt) > fiveMinutesAgo &&
			attempt.status === "failure" &&
			attempt.ipAddress !== "::1"
	);

	if (unusualAttempts.length > 3) {
		return true;
	}

	const user_ip =
		req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;

	// Filter the login attempts to include only the ones from different IP addresses
	const uniqueIPs = new Set(attempts.map((attempt) => attempt.ipAddress));
	const otherIPs = [...uniqueIPs].filter((ip) => ip === user_ip);

	// If there are other IP addresses in the login history, check if they are from unusual locations
	if (otherIPs.length !== 0) {
		if (user_ip !== "::1") {
			const location = getLocationFromIP(user_ip);

			return location;
		}
	}

	return false;
};

function getLocationFromIP(ipAddress) {
	var geo = geoip.lookup(ipAddress);

	const { country, region, city, ll } = geo;

	return { country, region, city, ll };
}

module.exports = loginCtrl;
