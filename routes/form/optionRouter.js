const router = require("express").Router();
const optionCtrl = require("../../controllers/form/optionControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get(
	"/forms/:idform/questions/:idquestion/options",
	optionCtrl.getOption
);
router.post(
	"/forms/:idform/questions/:idquestion/options/create",
	authenticateToken,
	optionCtrl.addOption
);
router.patch(
	"/forms/:idform/questions/:idquestion/options/:idoption/edit",
	authenticateToken,
	optionCtrl.updateOption
);
router.delete(
	"/forms/:idform/questions/:idquestion/options/:idoption/delete",
	authenticateToken,
	optionCtrl.deleteOption
);

module.exports = router;
