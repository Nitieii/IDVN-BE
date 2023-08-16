const router = require("express").Router();
const CRUDprojectsCtrl = require("../../controllers/project/CURDprojectControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/projects", authenticateToken, CRUDprojectsCtrl.getProjects);
router.get("/projects/:id", authenticateToken, CRUDprojectsCtrl.getProjectById);
router.get(
	"/projects/:id/statusAnalysis",
	authenticateToken,
	CRUDprojectsCtrl.getProjectStatusAnalysis
);

router.get(
	"/projects/:id/columnsAnalysis",
	authenticateToken,
	CRUDprojectsCtrl.getProjectColumnsAnalysis
);

router.get(
	"/projects/:id/membersAnalysis",
	authenticateToken,
	CRUDprojectsCtrl.getProjectMembersAnalysis
);

router.get(
	"/projects/:id/deadlineTasks",
	authenticateToken,
	CRUDprojectsCtrl.getProjectDeadlineTasks
);

router.post("/projects/search", authenticateToken, CRUDprojectsCtrl.search);
router.post(
	"/projects/create",
	authenticateToken,
	CRUDprojectsCtrl.addProjects
);

router.patch(
	"/projects/:id/update",
	authenticateToken,
	CRUDprojectsCtrl.updateProjectsInfor
);

router.delete(
	"/projects/:id",
	authenticateToken,
	CRUDprojectsCtrl.deleteProjects
);

module.exports = router;
