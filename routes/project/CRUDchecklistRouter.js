const router = require("express").Router();
const CRUDchecklistCtrl = require("../../controllers/project/CRUDchecklistControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.post(
	"/task/:idtask/checklist/create",
	authenticateToken,
	CRUDchecklistCtrl.addCheckLists
);
router.patch(
	"/task/:idtask/checklist/:idchecklist/edit",
	authenticateToken,
	CRUDchecklistCtrl.updateChecklist
);
router.delete(
	"/task/:idtask/checklist/:idchecklist/delete",
	authenticateToken,
	CRUDchecklistCtrl.deleteChecklist
);

module.exports = router;
