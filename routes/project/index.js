const checklistRouter = require("./CRUDchecklistRouter");
const noteRouter = require("./CRUDnoteRouter");
const projectRouter = require("./CRUDprojectRouter");
const stepRouter = require("./CRUDstepRouter");
const taskRouter = require("./CRUDtaskRouter");
const searchCheckListRouter = require("./SearchCheckListRouter");
const searchNoteRouter = require("./SearchNoteRouter");
const searchTaskFileRouter = require("./SearchTaskFileRouter");
const taskFileRouter = require("./taskfileRouter");

module.exports = {
	checklistRouter,
	noteRouter,
	projectRouter,
	stepRouter,
	taskRouter,
	searchCheckListRouter,
	searchNoteRouter,
	searchTaskFileRouter,
	taskFileRouter,
};
