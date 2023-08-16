const router = require("express").Router();
const CRUDtaskCtrl = require("../../controllers/project/CURDtasksControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/task/:id", authenticateToken, CRUDtaskCtrl.getTaskDetail);
router.get(
	"/projects/:idproject/tasks",
	authenticateToken,
	CRUDtaskCtrl.getTasksByProject
);
router.get(
	"/task/:idtask/timesheets",
	authenticateToken,
	CRUDtaskCtrl.getTimesheetsByTask
);
router.post(
	"/projects/:idproject/searchTask",
	authenticateToken,
	CRUDtaskCtrl.search
);
router.post(
	"/projects/:idproject/steps/:idstep/tasks/create",
	authenticateToken,
	CRUDtaskCtrl.addTasks
);
router.post(
	"/task/:id/createTimesheet",
	authenticateToken,
	CRUDtaskCtrl.addTimesheetByTask
);
router.patch("/tasks/:idtask/edit", authenticateToken, CRUDtaskCtrl.updateTask);
router.delete(
	"/projects/:idproject/steps/:idstep/tasks/:idtask/delete",
	authenticateToken,
	CRUDtaskCtrl.deleteTask
);

module.exports = router;
