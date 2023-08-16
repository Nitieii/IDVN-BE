const User = require("./user.model");
const Image = require("./image.model");
const Deadline = require("./deadline.model");
const FileExternal = require("./fileExternal.model");
const Note = require("./note.model");
const Team = require("./team.model");
const ActivityWeb = require("./activityWeb.model");
const New = require("./new/new.model");
const PlannedTask = require("./plannedTasks/plannedTask.model");
const TimeOff = require("./timeOff/timeOff.model");
const LoginHistory = require("./loginHistory.model");

const chatRoom = require("./chatRoom");
const form = require("./form");
const matter = require("./matter");
const note = require("./note");
const post = require("./post");
const project = require("./project");

module.exports = {
	User,
	Image,
	Deadline,
	FileExternal,
	Note,
	Team,
	ActivityWeb,
	New,
	PlannedTask,
	TimeOff,
	LoginHistory,
	project,
	matter,
	form,
	post,
	chatRoom,
	note,
};
