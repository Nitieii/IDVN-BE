const mongoose = require("mongoose");
const config = require("./config");

const db = async () => {
	await mongoose
		.connect(config.DBUri)
		.then(() => console.log("Connected to MongoDB"))
		.catch((err) => console.log(err));
	console.log("Connected to MongoDB");
};

module.exports = db;
