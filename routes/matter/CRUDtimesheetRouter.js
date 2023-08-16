const router = require("express").Router();
const CRUDtimesheetCtrl = require("../../controllers/matter/CURDtimesheetControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/timesheets", authenticateToken, CRUDtimesheetCtrl.getAllTimeSheet);
router.get(
	"/matters/:idmatter/timesheets",
	authenticateToken,
	CRUDtimesheetCtrl.getTimesheetByMatter
);
router.get(
	"/matters/:idmatter/timesheets/:idtimesheet",
	authenticateToken,
	CRUDtimesheetCtrl.getTimesheetById
);
router.get(
	"/timesheets/user",
	authenticateToken,
	CRUDtimesheetCtrl.getTimesheetByUser
);

router.post(
	"/matters/:idmatter/timesheets/search",
	authenticateToken,
	CRUDtimesheetCtrl.search
);

router.post(
	"/matters/:idmatter/timesheets/searchByDateMatter",
	CRUDtimesheetCtrl.searchByDateMatter
);
router.post(
	"/timesheets/user/search",
	authenticateToken,
	CRUDtimesheetCtrl.searchByUser
);
router.post(
	"/timesheets/search",
	authenticateToken,
	CRUDtimesheetCtrl.searchAll
);
router.post(
	"/matters/:idmatter/timesheets/create",
	authenticateToken,
	CRUDtimesheetCtrl.addTimesheet
);
router.post(
	"/timesheets/create",
	authenticateToken,
	CRUDtimesheetCtrl.addTimesheetByMatterCode
);
router.patch(
	"/timesheets/:idtimesheet/update",
	authenticateToken,
	CRUDtimesheetCtrl.updateTimsheet
);

router.post("/exportAllTeams", CRUDtimesheetCtrl.exportAllTeamsTimesheet);
router.delete(
	"/timesheets/:idtimesheet/delete",
	authenticateToken,
	CRUDtimesheetCtrl.deleteTimesheet
);

router.delete(
	"/timesheets/delete",
	authenticateToken,
	CRUDtimesheetCtrl.deleteMultipleTimesheets
);

router.get("/fixTimesheet", CRUDtimesheetCtrl.fixTimesheetCreatedByName);

module.exports = router;
