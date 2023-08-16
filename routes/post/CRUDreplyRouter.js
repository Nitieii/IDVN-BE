const router = require("express").Router();
const CRUDReplyCtrl = require("../../controllers/post/CURDreplyControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");
const multer = require("multer");
const upload = multer({ dest: "files/img_reply/" });

router.get("/comment/:idcomment/replies", CRUDReplyCtrl.getReplies);
router.post(
	"/comment/:idcomment/reply/create",
	authenticateToken,
	upload.single("file"),
	CRUDReplyCtrl.addReply
);
router.patch(
	"/reply/:idreply/edit",
	authenticateToken,
	CRUDReplyCtrl.updateReply
);
router.patch(
	"/reply/:idreply/updateNumLike",
	authenticateToken,
	CRUDReplyCtrl.updateNumberLikeReply
);
router.delete(
	"/reply/:idreply/delete",
	authenticateToken,
	CRUDReplyCtrl.deleteReply
);

module.exports = router;
