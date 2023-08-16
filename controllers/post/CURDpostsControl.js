const Post = require("../../models/post/post.model");
const Group = require("../../models/post/group.model");
const User = require("../../models/user.model");
const Notification = require("../../models/post/notification.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
// const client = redis.createClient(REDIS_PORT);
const moment = require("moment");

function paginate(array, page_size, page_number) {
	// human-readable page numbers usually start with 1, so we reduce 1 in the first argument
	return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const CRUDpostsCtrl = {
	getPosts: async (req, res) => {
		try {
			const group = await Group.findById(req.params.idgroup);
			console.log("group: ", group);
			const postOfGroup = group.posts;
			const postArr = [];
			let page = req.query.page;
			const result = paginate(postOfGroup.reverse(), 30, page);
			for (let i = 0; i < result.length; i++) {
				const post = await Post.findById(result[i]);
				console.log("post: ", post);
				postArr.push(post);
			}
			console.log("postArr: ", postArr);
			const arrayPostAfterSort = postArr.sort(function (a, b) {
				return new Date(b.createdAt) - new Date(a.createdAt);
			});
			return res.send({
				status: "success",
				posts: arrayPostAfterSort,
				group: group,
			});
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getPostById: async (req, res) => {
		try {
			const post = await Post.findById(req.params.id);
			console.log(post);
			if (post.groupID) {
				const group = await Group.findById(post.groupID);
				return res.send({ status: "success", post: post, group: group });
			} else {
				return res.send({ status: "success", post: post });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getAllPost: async (req, res) => {
		try {
			const post = await Post.find();
			let page = req.query.page;
			const result = paginate(post.reverse(), 30, page);
			const arrayPostAfterSort = result.sort(function (a, b) {
				return new Date(b.createdAt) - new Date(a.createdAt);
			});
			return res.send({ status: "success", posts: arrayPostAfterSort });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getPostOfUser: async (req, res) => {
		try {
			const user = await User.findById(req.params.iduser);
			const postOfUser = user.posts;
			const postArr = [];
			let page = req.query.page;
			const result = paginate(postOfUser.reverse(), 30, page);
			for (let i = 0; i < result.length; i++) {
				const post = await Post.findById(result[i]);
				postArr.push(post);
			}
			const arrayPostAfterSort = postArr.sort(function (a, b) {
				return new Date(b.createdAt) - new Date(a.createdAt);
			});
			return res.send({ status: "success", posts: arrayPostAfterSort });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	get4PostsHighest: async (req, res) => {
		try {
			const posts = await Post.aggregate([
				{
					$sort: {
						numLikes: -1,
					},
				},
				{
					$limit: 4,
				},
			]);

			return res.send({ status: "success", posts: posts });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	get5PostsRelated: async (req, res) => {
		try {
			const group = await Group.findById(req.params.idgroup);
			const postOfGroup = group.posts;
			const postArr = [];
			const fivepostrandom = [];
			for (let i = 0; i < postOfGroup.length; i++) {
				const post = await Post.findById(postOfGroup[i]);
				// console.log('createdAt: ', post.createdAt)
				postArr.push(post);
				// console.log('post: ', post)
			}
			// random 5 element
			if (postArr.length > 0 && postArr.length < 5) {
				return res.send({ status: "success", posts: postArr });
			}
			if (postArr.length >= 5) {
				for (let j = 0; j < 5; j++) {
					var randomItem = postArr[Math.floor(Math.random() * postArr.length)];
					fivepostrandom.push(randomItem);
				}
				return res.send({ status: "success", posts: fivepostrandom });
			}
			if (postArr.length === 0) {
				return res.send({ status: "success", posts: postArr });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updatePosts: async (req, res) => {
		try {
			const post = await Post.findById(req.params.id);
			if (req.user.id === post.createdBy) {
				if (req.body.title) {
					post.title = req.body.title;
				}
				if (req.body.content) {
					post.content = req.body.content;
				}

				post.save();
				// Emit event

				req.emit("postUpdated", post);
				// const posts = await Post.find();
				// client.set("post", JSON.stringify(posts));
				res.status(200).send({ message: "update success" });
				return res.send({ status: "success", message: "update success" });
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

	downVote: async (req, res) => {
		try {
			const post = await Post.findById(req.params.id);
			const userUp = post.upvote;
			const userDown = post.downvote;
			if (userDown.includes(req.user.id)) {
				return res.send({
					status: "error",
					message: "You has downvoted this post already!",
				});
			} else {
				if (userUp.includes(req.user.id)) {
					post.numLikes = post.numLikes - 2;
					const userindex = userUp.indexOf(req.user.id);
					console.log(userindex);
					userUp.splice(userindex, 1);
					post.save();
				} else {
					post.numLikes = post.numLikes - 1;
				}
				userDown.push(req.user.id);
				post.save();
				// Emit event

				req.emit("postUpdatedNumLike", post);
				return res.send({ status: "success", message: "update success" });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	upVote: async (req, res) => {
		try {
			const post = await Post.findById(req.params.id);
			const userUp = post.upvote;
			const userDown = post.downvote;
			if (userUp.includes(req.user.id)) {
				return res.send({
					status: "error",
					message: "You has upvote thí post already!",
				});
			} else {
				if (userDown.includes(req.user.id)) {
					post.numLikes = post.numLikes + 2;
					const userindex = userDown.indexOf(req.user.id);
					userDown.splice(userindex, 1);
					post.save();
				} else {
					post.numLikes = post.numLikes + 1;
				}
				userUp.push(req.user.id);
				post.save();
				// Emit event

				req.emit("postUpdatedNumLike", post);

				const user = await User.findById(post.createdBy);

				const noty = Notification.create({
					content: `<b>${req.user.fullname}</b> has upvoted your post: ${post.title}`,
					contentVN: `<b>${req.user.fullname}</b> đã up vote bài viết của bạn: ${post.title}`,
					createdByImage: user.image_url,
					type: "post",
					postId: post.id,
					receiverId: post.createdBy,
					createdAt: moment().format(),
				});

				// Push to notifications of user

				const notiOfUser = user.notification;
				notiOfUser.push(noty);
				user.save();

				// Event emitter socket notifications
				req.emit("sendNotification", noty);
				return res.send({ status: "success", message: "update success" });
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateNumberCommentPosts: async (req, res) => {
		try {
			const post = await Post.findById(req.params.id);

			post.numComments = post.numComments + 1;
			post.save();
			console.log(post.numComments);
			console.log(post);
			// Emit event

			req.emit("postUpdatedNumComment", post);
			// const posts = await Post.find();
			// client.set("post", JSON.stringify(posts));
			return res.send({ status: "success", message: "update success" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deletePosts: async (req, res) => {
		try {
			const post = await Post.findById(req.params.id);
			if (req.user.id === post.createdBy || req.user.role === "admin") {
				if (post.groupID) {
					const group = await Group.findById(post.groupID);
					const postArray = group.posts;
					const deletedPostIndex = postArray.indexOf(req.params.id);
					postArray.splice(deletedPostIndex, 1);
					group.save();
				}

				if (req.user.id == post.createdBy) {
					const user = await User.findById(post.createdBy);
					const postOfUser = user.posts;
					const postIndex = postOfUser.indexOf(req.params.id);
					postOfUser.splice(postIndex, 1);
					user.save();
				}

				const postDeleted = await Post.findByIdAndDelete(req.params.id);

				req.emit("DeletePost", postDeleted);

				return res.send({ status: "success", message: "Post deleted" });
			} else {
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
module.exports = CRUDpostsCtrl;
