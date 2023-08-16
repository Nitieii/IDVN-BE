const router = require("express").Router();
const signupCtrl = require("../../controllers/Auth/singupControl");
const { authenticateToken } = require("#middlewares");

router.post("/register", signupCtrl.Signup);
router.get("/user", signupCtrl.getUser);
router.post("/register/createClient", signupCtrl.addClient);
router.get(
	"/updateAllUserPass",
	authenticateToken,
	signupCtrl.updateAllUserPassword
);

module.exports = router;
