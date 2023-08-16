const router = require("express").Router();
const loginCtrl = require("#controllers/Auth/loginControll");
const { authenticateToken } = require("#middlewares");
require("dotenv").config();

router.get(
	"/activitiesTracking",
	authenticateToken,
	loginCtrl.AlertLoginActity
);

module.exports = router;
