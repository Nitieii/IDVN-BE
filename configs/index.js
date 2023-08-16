const eventsEmitter = require("./eventsEmitter");
const config = require("./config");
const routes = require("./routes");
const db = require("./db");

module.exports = {
	dailyReminder: {
		frequency: "* * * * *",
		handler: "handlers/timesheet/dailyReminder",
	},

	deadlineReminder: {
		frequency: "30 10 * * 1-5",
		handler: "handlers/deadlineReminder",
	},

	emptyDeadlineDB: {
		frequency: "0 1 * * 6",
		handler: "handlers/deadlineRemove",
	},
	eventsEmitter,
	config,
	routes,
	db,
};
