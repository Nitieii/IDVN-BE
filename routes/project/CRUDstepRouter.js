const router = require("express").Router();
const CRUDstepCtrl = require("../../controllers/project/CURDstepsControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.post(
	"/projects/:idproject/steps/create",
	authenticateToken,
	CRUDstepCtrl.addSteps
);
router.patch("/steps/:idstep/edit", authenticateToken, CRUDstepCtrl.updateStep);
router.delete(
	"/projects/:idproject/steps/:idstep/delete",
	authenticateToken,
	CRUDstepCtrl.deleteStep
);

module.exports = router;
