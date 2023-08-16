const Reply = require("../../models/post/reply.model");
const Comment = require("../../models/post/comment.model");
const User = require("../../models/user.model");
const Notification = require("../../models/post/notification.model");
const Post = require("../../models/post/post.model");

const moment = require("moment");
const fs = require("fs");
const util = require("util");
const unlinkFile = util.promisify(fs.unlink);

const CRUDReplyCtrl = {
	getReplies: async (req, res) => {
		try {
			const repliesArr = [];
			// Find comment
			const comment = await Comment.findById(req.params.idcomment);
			const repliesOfComment = comment.reply;

			// Find and push replies of comment
			for (let i = 0; i < repliesOfComment.length; i++) {
				const reply = await Reply.findById(repliesOfComment[i]);
				repliesArr.push(reply);
			}

			return res.send({ status: "success", replies: repliesArr });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addReply: async (req, res) => {
		try {
			const { uploadImg } = require("./upload_img_comment");
			const { content } = req.body;

			const comment = await Comment.findById(req.params.idcomment);
			const postId = comment.PostId;

			let replyfile = "";

			if (req.file) {
				const file = req.file;
				const result = await uploadImg(file);
				await unlinkFile(file.path);
				replyfile = result.Location;
			}

			const reply = await Reply.create({
				content,
				createdBy: req.user.id,
				createByName: req.user.fullname,
				userImg: req.user.image_url,
				parentCmtId: req.params.idcomment,
				postId: postId,
				replyFile: replyfile,
				createdAt: moment().format(),
			});

			// push reply in reply array of comment
			const repliesOfComment = comment.reply;
			repliesOfComment.push(reply.id);
			comment.save();

			// Emit event

			req.emit("Addreply", reply);

			const post = await Post.findById(postId);
			const user = await User.findById(post.createdBy);

			const noty = Notification.create({
				content: `<b>${req.user.fullname}</b> has replied your comment: ${comment.content}`,
				contentVN: `<b>${req.user.fullname}</b> đã trả lời bình luận của bạn: ${comment.content}`,
				createdByImage: user.image_url,
				type: "comment",
				commentId: comment.id,
				receiverId: comment.createdBy,
				createdAt: moment().format(),
			});

			// Push to notifications of user
			const notiOfUser = user.notification;
			notiOfUser.push(noty);
			user.save();

			// Event emitter socket notifications
			req.emit("sendNotification", noty);

			return res.send({ status: "success", reply: reply });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateReply: async (req, res) => {
		try {
			const reply = await Reply.findById(req.params.idreply);
			if (req.user.id == reply.createdBy) {
				reply.content = req.body.content;
				reply.save();
				// Emit event

				req.emit("replyUpdated", reply);
				return res.send({ status: "success", reply: reply });
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

	updateNumberLikeReply: async (req, res) => {
		try {
			const reply = await Reply.findById(req.params.idreply);

			reply.numLikes = reply.numLikes + req.body.numLikes;

			if (req.body.numLikes == 1) {
				reply.likedUsers.push(req.user.id);
			} else {
				let userLikeOfReply = reply.likedUsers;
				let indexOfUser = userLikeOfReply.indexOf(req.user.id);
				userLikeOfReply.splice(indexOfUser, 1);
			}

			reply.save();

			req.emit("replyUpdatedNumLike", reply);
			return res.send({
				status: "success",
				message: "Reply updated successfully",
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteReply: async (req, res) => {
		try {
			const reply = await Reply.findById(req.params.idreply);
			const comment = await Comment.findById(reply.parentCmtId);

			if (req.user.id == reply.createdBy || req.user.role == "admin") {
				const replyDeleted = await Reply.findByIdAndDelete(req.params.idreply);
				const replyArray = comment.reply;
				const deletedReplyIndex = replyArray.indexOf(req.params.idreply);
				replyArray.splice(deletedReplyIndex, 1);
				comment.save();
				// Emit event

				req.emit("Deletereply", replyDeleted);
				console.log("Reply deleted successfully");
				return res.send({
					status: "success",
					message: "Reply deleted successfully",
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

module.exports = CRUDReplyCtrl;
