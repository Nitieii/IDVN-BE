const router = require("express").Router();
const CRUDnotesSubCtrl = require("../../controllers/note/noteSub");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get(
	"/noteglobal/:idnote/notesubs",
	authenticateToken,
	CRUDnotesSubCtrl.getNotes
);
router.post(
	"/noteglobal/:idnote/notesubs/create",
	authenticateToken,
	CRUDnotesSubCtrl.addnoteSub
);
router.patch(
	"/noteglobal/:idnote/notesubs/:idnotesub/edit",
	authenticateToken,
	CRUDnotesSubCtrl.updateNoteSub
);
router.delete(
	"/noteglobal/:idnote/notesubs/:idnotesub/delete",
	authenticateToken,
	CRUDnotesSubCtrl.deleteNoteSub
);

module.exports = router;
