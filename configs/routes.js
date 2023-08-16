const { errorHandler } = require("#middlewares");

const {
	userRouter,
	emailRouter,
	imgRouter,
	uploadToExternalRouter,
	timeOffRouter,
	messageRouter,
	newRouter,
	teamRouter,
	plannedTaskRouter,
	activityTrackingRouter,
} = require("#routes");
const { signupRouter, loginRouter } = require("#routes").auth;
const { postRouter, commentRouter, replyRouter, groupRouter } =
	require("#routes").post;
const { formRouter, questionRouter, optionRouter } = require("#routes").form;
const { fileRouter, searchPDFRouter } = require("#routes").fileInternal;
const {
	projectRouter,
	stepRouter,
	taskRouter,
	noteRouter,
	taskFileRouter,
	checklistRouter,
	searchCheckListRouter,
	searchNoteRouter,
	searchTaskFileRouter,
} = require("#routes").project;
const { matterRouter, timesheetRouter, noteMatterRouter, documentRouter } =
	require("#routes").matter;

/**
 * @param {Object} app express application
 */
const routes = (app) => {
	app.get("/", (req, res) => {
		res.send("Welcome to VNLIS server");
	});

	// auth
	app.use("/api", signupRouter);
	app.use("/api", loginRouter);

	app.use("/api", userRouter);
	app.use("/api", emailRouter);
	app.use("/api", imgRouter);
	app.use("/api", uploadToExternalRouter);
	app.use("/api", timeOffRouter);
	app.use("/api", messageRouter);
	app.use("/api", teamRouter);
	app.use("/api", newRouter);
	app.use("/api", plannedTaskRouter);

	// post
	app.use("/api", postRouter);
	app.use("/api", commentRouter);
	app.use("/api", replyRouter);
	app.use("/api", groupRouter);

	// form
	app.use("/api", formRouter);
	app.use("/api", questionRouter);
	app.use("/api", optionRouter);

	// project
	app.use("/api", projectRouter);
	app.use("/api", stepRouter);
	app.use("/api", taskRouter);
	app.use("/api", noteRouter);
	app.use("/api", taskFileRouter);
	app.use("/api", searchTaskFileRouter);
	app.use("/api", checklistRouter);
	app.use("/api", searchCheckListRouter);
	app.use("/api", searchNoteRouter);

	// matter
	app.use("/api", matterRouter);
	app.use("/api", noteMatterRouter);
	app.use("/api", timesheetRouter);
	app.use("/api", documentRouter);

	// file internal
	app.use("/api", fileRouter);
	app.use("/api", searchPDFRouter);

	// activity tracking
	app.use("/api", activityTrackingRouter);

	// error handler
	app.use(errorHandler);
};

module.exports = routes;
