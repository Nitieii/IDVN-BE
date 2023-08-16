const User = require("../../models/user.model");
const Post = require("../../models/post/post.model");
const Comment = require("../../models/post/comment.model");
const Notification = require("../../models/post/notification.model");

const moment = require("moment");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");

// const client = redis.createClient(REDIS_PORT);

function paginate(array, page_size, page_number) {
	// human-readable page numbers usually start with 1, so we reduce 1 in the first argument
	return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const CRUDCommentCtrl = {
	getComments: async (req, res) => {
		try {
			const commentsArr = [];
			const post = await Post.findById(req.params.idpost);
			const commentOfPost = post.Comments;
			let page = req.query.page;

			const result = paginate(commentOfPost.reverse(), 10, page);

			for (let i = 0; i < result.length; i++) {
				const comment = await Comment.findById(result[i]);
				commentsArr.push(comment);
			}

			const totalPage = parseInt((commentOfPost.length + 10 - 1) / 10);

			return res.send({
				status: "success",
				comments: commentsArr,
				totalPage: totalPage,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addComment: async (req, res) => {
		try {
			const { uploadImg } = require("./upload_img_comment");
			const { content } = req.body;
			let commentfile = "";

			if (req.file) {
				const file = req.file;
				const result = await uploadImg(file);
				await unlinkFile(file.path);
				commentfile = result.Location;
			}

			const comment = await Comment.create({
				content,
				createdBy: req.user.id,
				createByName: req.user.fullname,
				userImg: req.user.image_url,
				PostId: req.params.idpost,
				commentFile: commentfile,
				createdAt: moment().format(),
			});

			const post = await Post.findById(req.params.idpost);
			const commentOfPost = post.Comments;
			commentOfPost.push(comment);
			post.numComments = post.numComments + 1;
			post.save();

			// Emit event

			req.emit("Addcomment", comment);

			const user = await User.findById(post.createdBy);

			// Create New noti
			const noty = await Notification.create({
				content: `<b>${req.user.fullname}</b> has commented on your post: <b>${post.title}</b>`,
				contentVN: `<b>${req.user.fullname}</b> đã bình luận về bài viết: <b>${post.title}</b>`,
				createdByImage: user.image_url,
				type: "post",
				commentId: comment.id,
				postId: post.id,
				receiverId: post.createdBy,
				createdAt: moment().format(),
			});

			// Push to notifications of user
			const notiOfUser = user.notifications;
			notiOfUser.push(noty.id);
			user.save();

			// Event emitter socket notifications
			req.app.emit("sendNotification", noty);

			return res.send({ status: "success", comment: comment });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateComment: async (req, res) => {
		try {
			const comment = await Comment.findById(req.params.idcomment);
			if (req.user.id == comment.createdBy) {
				comment.content = req.body.content;
				comment.save();
				// Emit event

				req.emit("commentUpdated", comment);
				return res.send({ status: "success", comment: comment });
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNumberLikeComment: async (req, res) => {
		try {
			const comment = await Comment.findById(req.params.idcomment);

			comment.numLikes = comment.numLikes + req.body.numLikes;

			if (req.body.numLikes == 1) {
				comment.likedUsers.push(req.user.id);
				const user = await User.findById(comment.createdBy);

				const noty = Notification.create({
					content: `<b>${req.user.fullname}</b> has liked your comment: ${comment.content}`,
					contentVN: `<b>${req.user.fullname}</b> đã thích bình luận của bạn: ${comment.content}`,
					createdByImage: user.image_url,
					type: "comment",
					commentId: comment.id,
					postId: comment.PostId,
					receiverId: comment.createdBy,
					createdAt: moment().format(),
				});

				// Push to notifications of user

				const notiOfUser = user.notification;
				notiOfUser.push(noty);
				user.save();

				// Event emitter socket notifications
				req.emit("sendNotification", noty);
			} else {
				let userLikeOfComment = comment.likedUsers;
				let indexOfUser = userLikeOfComment.indexOf(req.user.id);
				userLikeOfComment.splice(indexOfUser, 1);
			}

			comment.save();

			req.emit("commentUpdatedNumLike", comment);

			return res.send({
				status: "success",
				message: "Comment updated successfully",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteComment: async (req, res) => {
		try {
			const comment = await Comment.findById(req.params.idcomment);
			if (req.user.id == comment.createdBy) {
				const commentDeleted = await Comment.findByIdAndDelete(
					req.params.idcomment
				);
				const post = await Post.findById(req.params.idpost);
				const CommentArray = post.Comments;
				const deletedCommentIndex = CommentArray.indexOf(req.params.idcomment);
				CommentArray.splice(deletedCommentIndex, 1);
				post.numComments = post.numComments - 1;
				post.save();
				// Emit event

				req.emit("Deletecomment", commentDeleted);
				console.log("Comment deleted successfully");
				return res.send({
					status: "success",
					message: "Comment deleted successfully",
				});
			} else {
				console.log("Account does not have this permission");
				return res.send({
					status: "error",
					message: "Account does not have this permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};

module.exports = CRUDCommentCtrl;
