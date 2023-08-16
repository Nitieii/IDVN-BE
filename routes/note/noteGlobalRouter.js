const router = require("express").Router();
const CRUDnotesGlobalCtrl = require("../../controllers/note/noteGlobal");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/noteglobal", CRUDnotesGlobalCtrl.getNotes);
router.get(
	"/noteglobal/:id",
	authenticateToken,
	CRUDnotesGlobalCtrl.getNoteById
);
router.post(
	"/noteglobal/create",
	authenticateToken,
	CRUDnotesGlobalCtrl.addnotes
);
router.patch(
	"/noteglobal/:id/edit",
	authenticateToken,
	CRUDnotesGlobalCtrl.updateNotes
);
router.delete(
	"/noteglobal/:id/delete",
	authenticateToken,
	CRUDnotesGlobalCtrl.deleteNotes
);

module.exports = router;
