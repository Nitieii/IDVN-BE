const teamRouter = require("./CRUDteamRouter");
const userRouter = require("./CRUDuserRouter");
const emailRouter = require("./EmailRouter");
const imgRouter = require("./imgRouter");
const timeOffRouter = require("./timeOff.routes");
const uploadToExternalRouter = require("./uploadToExternalRouter");
const messageRouter = require("./ChatRoom/messageRouter");
const newRouter = require("./new/newRouter");
const plannedTaskRouter = require("./PlannedTask/plannedTasks.router.js");
const transcribeRouter = require("./transcribeLanguage");
const activityTrackingRouter = require("./ActivityTrackingRouter");

const auth = require("./Auth");
const fileInternal = require("./file_internal");
const form = require("./form");
const matter = require("./matter");
const note = require("./note");
const post = require("./post");
const project = require("./project");

module.exports = {
	teamRouter,
	userRouter,
	emailRouter,
	imgRouter,
	timeOffRouter,
	uploadToExternalRouter,
	messageRouter,
	newRouter,
	plannedTaskRouter,
	auth,
	fileInternal,
	form,
	matter,
	note,
	post,
	project,

	transcribeRouter,
	activityTrackingRouter,
};
