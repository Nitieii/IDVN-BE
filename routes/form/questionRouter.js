const router = require("express").Router();
const questionCtrl = require("../../controllers/form/questionControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/forms/:idform/questions", questionCtrl.getQuestion);
router.get(
	"/forms/:idform/questions/:idquestion",
	questionCtrl.getQuestionById
);
router.post(
	"/form/:idform/question/create",
	authenticateToken,
	questionCtrl.addQuestion
);
router.post("/form/:idform/question/search", questionCtrl.search);
router.patch(
	"/form/:idform/questions/:idquestion/edit",
	authenticateToken,
	questionCtrl.updateQuestion
);
router.delete(
	"/form/:idform/questions/:idquestion/delete",
	authenticateToken,
	questionCtrl.deleteQuestion
);

module.exports = router;
