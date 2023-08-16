const router = require("express").Router();
const SearchTaskFileCtrl = require("../../controllers/project/searchTaskFileControl");
const { authenticateToken } = require("#middlewares");

router.post(
	"/tasks/:idtask/searchFile",
	authenticateToken,
	SearchTaskFileCtrl.search
);

module.exports = router;
