const router = require("express").Router();
const loginCtrl = require("../../controllers/Auth/loginControll");
require("dotenv").config();

router.post("/login", loginCtrl.Login);
router.delete("/logout", loginCtrl.Logout);
router.get("/verify/:id", loginCtrl.verify);

module.exports = router;
