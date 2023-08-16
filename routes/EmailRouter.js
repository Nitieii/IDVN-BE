const router = require("express").Router();
const EmailCtrl = require("../controllers/sendEmailControl");
require("dotenv").config();

router.post("/sendemail", EmailCtrl.sendEmail);

module.exports = router;
