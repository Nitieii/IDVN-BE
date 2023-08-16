const router = require("express").Router();
const CRUDnotesCtrl = require("../../controllers/project/CURDnotesControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.post(
	"/task/:idtask/notes/create",
	authenticateToken,
	CRUDnotesCtrl.addnotes
);
router.patch(
	"/note/:idnote/edit",
	authenticateToken,
	CRUDnotesCtrl.updateNotes
);
router.delete(
	"/note/:idnote/delete",
	authenticateToken,
	CRUDnotesCtrl.deleteNotes
);

module.exports = router;
