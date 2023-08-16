const router = require("express").Router();
const CRUDtimeOffCtrl = require("../controllers/timeOff.controllers");
const { authenticateToken } = require("#middlewares");
require("dotenv").config();

router.get("/timeOff", authenticateToken, CRUDtimeOffCtrl.getTimeOff);

router.post(
	"/timeOff/create",
	authenticateToken,
	CRUDtimeOffCtrl.createTimeOff
);

router.patch(
	"/timeOff/:id/edit",
	authenticateToken,
	CRUDtimeOffCtrl.editTimeOff
);

router.delete(
	"/timeOff/:id/delete",
	authenticateToken,
	CRUDtimeOffCtrl.deleteTimeOff
);

module.exports = router;
