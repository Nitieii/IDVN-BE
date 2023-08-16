const router = require("express").Router();
const FilesCtrl = require("../../controllers/file_internal/uploadToInternalControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/files", authenticateToken, FilesCtrl.getFiles);
router.get("/files/:id/download", FilesCtrl.downloadFile);
router.patch("/files/:id/update", authenticateToken, FilesCtrl.updateFiles);
router.get("/files/:id/readfile", FilesCtrl.ReadFile);
router.delete("/files/:id/delete", authenticateToken, FilesCtrl.deleteFile);

module.exports = router;
