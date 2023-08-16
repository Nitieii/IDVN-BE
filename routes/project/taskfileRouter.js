const router = require("express").Router();
const TaskFilesCtrl = require("../../controllers/project/taskFileControl");
const { authenticateToken } = require("#middlewares");
require("dotenv").config();

router.get("/task/:idtask/taskfiles", TaskFilesCtrl.getTaskFiles);
router.get(
	"/task/:idtask/taskfiles/:idtaskfile/download",
	TaskFilesCtrl.downloadTaskFile
);
router.patch(
	"/task/:idtask/taskfiles/:idtaskfile/update",
	authenticateToken,
	TaskFilesCtrl.updateTaskFiles
);
router.get(
	"/task/:idtask/taskfiles/:idtaskfile/readfile",
	TaskFilesCtrl.ReadTaskFile
);
router.delete(
	"/task/:idtask/taskfiles/:idtaskfile/delete",
	authenticateToken,
	TaskFilesCtrl.deleteTaskFile
);

module.exports = router;
