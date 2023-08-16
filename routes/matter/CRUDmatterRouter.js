const router = require("express").Router();
const CRUDmatterCtrl = require("../../controllers/matter/CURDmatterControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

const multer = require("multer");
const upload = multer({ dest: "files/matter/" });

router.get("/matters", authenticateToken, CRUDmatterCtrl.getMatter);
router.get(
	"/getMatterFollowers/:id",
	authenticateToken,
	CRUDmatterCtrl.getMatterFollowers
);
router.get("/matterName", authenticateToken, CRUDmatterCtrl.getMatterName);
router.get("/getMatterCode", authenticateToken, CRUDmatterCtrl.getMatterCode);
router.get("/matter/user", authenticateToken, CRUDmatterCtrl.getUserMatters);

router.post(
	"/searchAdverseParty",
	authenticateToken,
	CRUDmatterCtrl.searchAdverseParty
);

router.post(
	"/sendClearConflictReq",
	authenticateToken,
	CRUDmatterCtrl.sendClearConflictReq
);

router.post(
	"/importMatters",
	// authenticateToken,
	upload.single("file"),
	CRUDmatterCtrl.importExcel
);

router.post("/matters/create", authenticateToken, CRUDmatterCtrl.addMatter);
router.post("/matters/search", authenticateToken, CRUDmatterCtrl.search);
router.post(
	"/matters/analysis",
	authenticateToken,
	CRUDmatterCtrl.getUserMatterAnalysis
);

router.patch(
	"/matters/:id/update",
	authenticateToken,
	CRUDmatterCtrl.updateMatter
);
router.delete("/matters/:id", authenticateToken, CRUDmatterCtrl.deleteMatter);

module.exports = router;
