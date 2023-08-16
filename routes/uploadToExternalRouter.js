const router = require("express").Router();
const FilesExternalCtrl = require("../controllers/uploadToExternalControl");
const { authenticateToken } = require("#middlewares");
require("dotenv").config();

router.get("/fileExternal", FilesExternalCtrl.getFilesExternal);
router.get("/searchFilesExternal", FilesExternalCtrl.searchFilesExternal);
router.get("/fileExternal/:id", FilesExternalCtrl.getById);
router.get("/TopFileExternal", FilesExternalCtrl.get8FilesHighest);
router.get("/external_file/:id/related", FilesExternalCtrl.getFileRelated);
router.patch("/fileExternal/:id/update", FilesExternalCtrl.updateFiles);
router.get("/fileExternal/:id/readfile", FilesExternalCtrl.ReadFile);

// router.get("/searchWithGPT", FilesExternalCtrl.searchWithGPT);

router.delete(
	"/fileExternal/:id/delete",
	authenticateToken,
	FilesExternalCtrl.deleteFileExternal
);
router.get("/external_file/search", FilesExternalCtrl.search);

module.exports = router;
