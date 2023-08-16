const router = require("express").Router();
const CRUDpostsCtrl = require("../../controllers/post/CURDpostsControl");
require("dotenv").config();
const { authenticateToken } = require("#middlewares");

router.get("/group/:idgroup/posts", CRUDpostsCtrl.getPosts);
router.get("/group/:idgroup/postsRelated", CRUDpostsCtrl.get5PostsRelated);
router.get("/posts", CRUDpostsCtrl.getAllPost);
router.get("/posts/:id", CRUDpostsCtrl.getPostById);
router.get("/user/:iduser/posts", CRUDpostsCtrl.getPostOfUser);
router.get("/postTop", CRUDpostsCtrl.get4PostsHighest);
router.patch("/posts/:id/edit", authenticateToken, CRUDpostsCtrl.updatePosts);
router.delete("/posts/:id", authenticateToken, CRUDpostsCtrl.deletePosts);
router.patch("/posts/:id/upvote", authenticateToken, CRUDpostsCtrl.upVote);
router.patch("/posts/:id/downvote", authenticateToken, CRUDpostsCtrl.downVote);
router.patch(
	"/group/:idgroup/posts/:id/updateNumComment",
	CRUDpostsCtrl.updateNumberCommentPosts
);

module.exports = router;
