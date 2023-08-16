const Group = require("../../models/post/group.model");
const User = require("../../models/user.model");
// const REDIS_PORT = process.env.PORT || 6379;
// const redis = require("redis");
// const client = redis.createClient(REDIS_PORT);
const moment = require("moment");

const CRUDgroupsCtrl = {
	getGroups: async (req, res) => {
		try {
			const groups = await Group.find();
			return res.send({ status: "success", groups: groups });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	getGroupById: async (req, res) => {
		try {
			const group = await Group.findById(req.params.id);
			const memberInGroup = group.members;
			if (memberInGroup.includes(req.user.id)) {
				return res.send({ status: "success", group: group });
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

	get6GroupRandom: async (req, res) => {
		try {
			const group = await Group.find();
			const sixgrouprandom = [];
			// random 6 element
			for (let j = 0; j < 6; j++) {
				var randomItem = group[Math.floor(Math.random() * group.length)];
				sixgrouprandom.push(randomItem);
			}
			return res.send({ status: "success", groups: sixgrouprandom });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	addgroup: async (req, res) => {
		const { title, description } = req.body;
		try {
			const group = await Group.create({
				title,
				description,
				createdBy: req.user.id,
				createdAt: moment().format(),
			});
			console.log("Group added successfully: ", group);
			group.save();
			// Emit event

			req.emit("Addgroup", group);
			// const posts = await Post.find();
			// client.set("post", JSON.stringify(posts));
			return res.send({ status: "success", group: group });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	updateGroup: async (req, res) => {
		try {
			const group = await Group.findById(req.params.id);
			console.log("group: ", group);
			console.log("req.user.id: ", req.user.id);
			if (req.user.id === group.createdBy || req.user.role === "admin") {
				if (req.body.title) {
					group.title = req.body.title;
				}
				group.save();
				console.log("group: ", group);
				// Emit event

				req.emit("groupUpdated", group);
				// const posts = await Post.find();
				// client.set("post", JSON.stringify(posts));
				return res.send({ status: "success", message: "update success" });
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

	joinGroup: async (req, res) => {
		try {
			const group = await Group.findById(req.params.id);
			const memberInGrroup = group.members;
			memberInGrroup.push(req.user.id);
			group.numMembers = group.numMembers + 1;
			group.save();
			// add group in schema user
			const user = await User.findById(req.user.id);
			const groupOfUser = user.groups;
			if (groupOfUser.indexOf(req.params.id) === -1) {
				groupOfUser.push(group);
			}
			user.save();
			console.log("group: ", group);
			// Emit event

			req.emit("groupUpdated", group);
			return res.send({ status: "success", message: "join success" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	outGroup: async (req, res) => {
		try {
			const group = await Group.findById(req.params.id);
			// delete user in group
			const memberInGrroup = group.members;
			const user = await User.findById(req.user.id);
			const deleteduserIndex = memberInGrroup.indexOf(req.user.id);
			memberInGrroup.splice(deleteduserIndex, 1);
			group.numMembers = group.numMembers - 1;
			group.save();
			// delete group in schema user
			const groupOfUser = user.groups;
			const deletedGroupIndex = groupOfUser.indexOf(req.params.id);
			groupOfUser.splice(deletedGroupIndex, 1);
			user.save();
			return res.send({ status: "success", message: "out group!" });
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteGroup: async (req, res) => {
		try {
			const group = await Group.findById(req.params.id);
			if (req.user.id === group.createdBy || req.user.role === "admin") {
				const groupDeleted = await Group.findByIdAndDelete(req.params.id);
				groupDeleted.save();

				req.emit("Deletegroup", group);
				return res.send({ status: "success", message: "Group deleted." });
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
module.exports = CRUDgroupsCtrl;
