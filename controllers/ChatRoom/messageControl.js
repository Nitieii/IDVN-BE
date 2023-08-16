const Message = require("../../models/chatRoom/message.model");
const Project = require("../../models/project/project.model");
const User = require("../../models/user.model");
const moment = require("moment");

const InternalNotification = require("../../models/project/internalNotification.model");

function paginate(array, page_size, page_number) {
	// human-readable page numbers usually start with 1, so we reduce 1 in the first argument
	return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const CRUDmessageCtrl = {
	getMessages: async (req, res) => {
		const user = await User.findById(req.user.id);
		const projectOfUser = user.projects;
		const messageArray = [];

		if (req.user.role == "admin") {
			try {
				const project = await Project.findById(req.params.idproject);
				const messageOfProject = project.messages;
				let page = req.query.page;

				const result = paginate(messageOfProject, 50, page);
				for (let j = 0; j < result.length; j++) {
					const message = await Message.findById(result[j]);
					messageArray.push(message);
				}

				const totalPage = parseInt((messageOfProject.length + 50 - 1) / 50);
				return res.send({
					status: "success",
					message: messageArray,
					totalPage: totalPage,
				});
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		} else {
			try {
				const project = await Project.findById(req.params.idproject);
				const messageOfProject = project.messages;
				let page = req.query.page;

				const result = paginate(messageOfProject, 50, page);
				
				for (let j = 0; j < result.length; j++) {
					const message = await Message.findById(result[j]);
					messageArray.push(message);
				}

				const totalPage = parseInt((messageOfProject.length + 50 - 1) / 50);
				return res.send({
					status: "success",
					message: messageArray,
					totalPage: totalPage,
				});
			} catch (err) {
				return res.send({ status: "error", message: err.message });
			}
		}
	},

	addMessage: async (req, res) => {
		try {
			const project = await Project.findById(req.params.idproject);
			const receiverIds = project.assignedTo;

			const { content } = req.body;

			if (receiverIds.includes(req.user.id) || req.user.role == "admin") {
				const message = await Message.create({
					content,
					projectId: req.params.idproject,
					sentById: req.user.id,
					sentBy: req.user.fullname,
					SenderImg: req.user.image_url,
					createdAt: moment().format(),
				});
				message.save();
				const project = await Project.findById(req.params.idproject);
				const MessageOfProject = project.messages;
				MessageOfProject.push(message);
				project.save();

				// exclue current user from getting notifications
				// if (receiverIds.includes(req.user.id)) {
				//   const indexOfSentUser = receiverIds.indexOf(req.user.id);
				//   receiverIds.splice(indexOfSentUser, 1);
				// }

				const noty = await InternalNotification.create({
					content: `<b>${req.user.fullname}</b> has sent a new message: <b>${message.content}</b> in the project: <b>${project.title}</b>`,
					createdByImage: req.user.image_url,
					projectId: project.id,
					receiverId: receiverIds,
					createdAt: moment().format(),
				});
				noty.save();

				for (let i = 0; i < receiverIds.length; i++) {
					const user = await User.findById(receiverIds[i]);
					if (!user.internalNotifications) {
						user.internalNotifications = [];
					}
					const notiOfUser = user.internalNotifications;
					notiOfUser.push(noty.id);
					user.save();
				}

				// Emit event
				req.emit("SendMessage", message);
				req.emit("SendInternalNotifications", noty);

				return res.send({ status: "success", message: message });
			} else {
				return res.send({
					status: "error",
					message: "User does not have the permission",
				});
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},

	deleteMessage: async (req, res) => {
		const user = await User.findById(req.user.id);
		const projectOfUser = user.projects;
		try {
			for (let i = 0; i < projectOfUser.length; i++) {
				if (projectOfUser[i] == req.params.idproject) {
					const messageDeleted = await Message.findByIdAndDelete(
						req.params.idmessage
					);

					const project = await Project.findById(req.params.idproject);
					const messageArray = project.messages;
					const deletedMessageIndex = messageArray.indexOf(
						req.params.idmessage
					);
					messageArray.splice(deletedMessageIndex, 1);
					project.save();

					// Emit event
					req.emit("DeleteMessage", messageDeleted);
					return res.send({ status: "success", message: "Message deleted" });
				}
			}
		} catch (err) {
			return res.send({ status: "error", message: err.message });
		}
	},
};
module.exports = CRUDmessageCtrl;
