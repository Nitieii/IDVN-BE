const router = require("express").Router();
const CRUDgroupsCtrl = require("../../controllers/post/CURDgroupsControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/groups", CRUDgroupsCtrl.getGroups);
router.get("/groups/:id", authenticateToken, CRUDgroupsCtrl.getGroupById);
router.get("/groupsRandom", CRUDgroupsCtrl.get6GroupRandom);
router.post("/group/create", authenticateToken, CRUDgroupsCtrl.addgroup);
router.patch("/group/:id/edit", authenticateToken, CRUDgroupsCtrl.updateGroup);
router.patch("/group/:id/join", authenticateToken, CRUDgroupsCtrl.joinGroup);
router.patch("/group/:id/out", authenticateToken, CRUDgroupsCtrl.outGroup);
router.delete(
	"/group/:id/delete",
	authenticateToken,
	CRUDgroupsCtrl.deleteGroup
);

module.exports = router;
