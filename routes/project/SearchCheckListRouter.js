const router = require("express").Router();
const SearchCheckListCtrl = require("../../controllers/project/searchCheckListControl");
const { authenticateToken } = require("#middlewares");

router.post(
	"/tasks/:idtask/searchCheckList",
	authenticateToken,
	SearchCheckListCtrl.search
);

module.exports = router;
