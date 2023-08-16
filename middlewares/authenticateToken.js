const { User } = require("#models");
const config = require("#configs/config");
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) return res.sendStatus(401);

	jwt.verify(token, config.TOKEN.ACCESS_TOKEN_SECRET, async (err, user) => {
		if (err) return res.sendStatus(403);
		const checkUser = await User.findById(user.id);
		if (!checkUser) return res.sendStatus(403);
		req.user = checkUser;
		next();
	});
};

module.exports = authenticateToken;
