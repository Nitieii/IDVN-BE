const router = require("express").Router();
const SearchCtrl = require("../../controllers/file_internal/searchPDFControl");
const { authenticateToken } = require("#middlewares");

router.post("/searchPDF", authenticateToken, SearchCtrl.search);

module.exports = router;
