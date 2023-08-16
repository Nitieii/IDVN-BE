const router = require("express").Router();
const CRUDNewCtrl = require("../../controllers/new/newControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");
const multer = require("multer");
const upload = multer({ dest: "files/news_banner/" });

router.get("/news", CRUDNewCtrl.getNews);
router.get("/news/:id", CRUDNewCtrl.getNewById);
router.get("/news/:id/related", CRUDNewCtrl.getNewRelated);
router.post("/news/create", authenticateToken, CRUDNewCtrl.addNew);
router.post("/news/search", CRUDNewCtrl.search);
router.patch(
	"/news/:id/upload_banner",
	authenticateToken,
	upload.single("file"),
	CRUDNewCtrl.upImg
);
router.patch("/news/:id/edit", authenticateToken, CRUDNewCtrl.updateNew);
router.delete("/news/:id/delete", authenticateToken, CRUDNewCtrl.deleteNew);

module.exports = router;
