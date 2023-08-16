const router = require("express").Router();
const CURDPlannedTasksControl = require("../../controllers/PlannedTasks/CURDplannedTasksControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get(
	"/getPlannedTasksByTeam",
	authenticateToken,
	CURDPlannedTasksControl.getPlannedTasksByTeam
);
router.get(
	"/plannedTasks/user",
	authenticateToken,
	CURDPlannedTasksControl.getPlannedTasksByUserId
);

router.post(
	"/plannedTasks/create",
	authenticateToken,
	CURDPlannedTasksControl.createPlannedTasks
);

router.patch(
	"/plannedTasks/:id/edit",
	authenticateToken,
	CURDPlannedTasksControl.editPlannedTasks
);

module.exports = router;
