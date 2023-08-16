const router = require("express").Router();
const formCtrl = require("../../controllers/form/formControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/forms", formCtrl.getForm);
router.get("/forms/:id", formCtrl.getFormById);
router.post("/form/create", authenticateToken, formCtrl.addForm);
router.post("/form/search", formCtrl.search);
router.patch("/form/:id/edit", authenticateToken, formCtrl.updateForm);
router.delete("/form/:id/delete", authenticateToken, formCtrl.deleteForm);

module.exports = router;
