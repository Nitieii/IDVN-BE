const router = require("express").Router();
const CRUDnotesCtrl = require("../../controllers/matter/CURDnotesMatterControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/matter/:matterId/notes", CRUDnotesCtrl.getNotes);
router.get("/duplicate-matter", CRUDnotesCtrl.getDuplicateMatter);
router.post(
	"/matter/:matterId/notes/create",
	authenticateToken,
	CRUDnotesCtrl.addnotes
);
router.patch(
	"/matter/:matterId/notes/:idnote/edit",
	authenticateToken,
	CRUDnotesCtrl.updateNotes
);
router.delete(
	"/matter/:matterId/notes/:idnote/delete",
	authenticateToken,
	CRUDnotesCtrl.deleteNotes
);

module.exports = router;
