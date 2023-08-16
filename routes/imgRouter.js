const router = require("express").Router();
const { authenticateToken } = require("#middlewares");
const ImgCtrl = require("../controllers/imageControl");

router.get("/users/:userId/img", ImgCtrl.getImage);
router.get("/users/:userId/img/:idimg/download", ImgCtrl.downloadImg);
router.delete(
	"/users/:userId/img/:idimg/delete",
	authenticateToken,
	ImgCtrl.deleteImg
);

module.exports = router;
