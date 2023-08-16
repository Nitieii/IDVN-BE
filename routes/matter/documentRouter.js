const router = require("express").Router();
const DocumentCtrl = require("../../controllers/matter/documentControl");
const { authenticateToken } = require("#middlewares");
require("dotenv").config();

router.get("/matter/:idmatter/document", DocumentCtrl.getDocuments);
router.get(
	"/matter/:idmatter/document/:iddocument/download",
	DocumentCtrl.downloadDocument
);
router.get("/matter/:idmatter/document/search", DocumentCtrl.search);
router.patch(
	"/matter/:idmatter/document/:iddocument/update",
	authenticateToken,
	DocumentCtrl.updateDocument
);
router.get(
	"/matter/:idmatter/document/:iddocument/readfile",
	DocumentCtrl.ReadDocument
);
router.delete(
	"/matter/:idmatter/document/:iddocument/delete",
	authenticateToken,
	DocumentCtrl.deleteDocument
);

module.exports = router;
