const router = require("express").Router();
const CRUDCommentCtrl = require("../../controllers/post/CURDcommentControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");
const multer = require("multer");
const upload = multer({ dest: "files/img_comment/" });

router.get("/post/:idpost/comments", CRUDCommentCtrl.getComments);
router.post(
	"/post/:idpost/comments/create",
	authenticateToken,
	upload.single("file"),
	CRUDCommentCtrl.addComment
);
router.patch(
	"/post/:idpost/comments/:idcomment/edit",
	authenticateToken,
	CRUDCommentCtrl.updateComment
);
router.patch(
	"/post/:idpost/comments/:idcomment/updateNumLike",
	authenticateToken,
	CRUDCommentCtrl.updateNumberLikeComment
);
router.delete(
	"/post/:idpost/comments/:idcomment/delete",
	authenticateToken,
	CRUDCommentCtrl.deleteComment
);

module.exports = router;
