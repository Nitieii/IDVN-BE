const router = require("express").Router();
const SearchNoteCtrl = require("../../controllers/project/searchNoteControl");
const { authenticateToken } = require("#middlewares");

router.post(
	"/tasks/:idtask/searchNote",
	authenticateToken,
	SearchNoteCtrl.search
);

module.exports = router;
