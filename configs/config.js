const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const config = {
	BASE: {
		HOSTNAME: process.env.BASE_URL,
		PORT: process.env.BASE_PORT,
	},
	DB: {
		URL: process.env.MONGOOSE_URL,
		HOST: process.env.MONGOOSE_HOST,
		PORT: process.env.MONGOOSE_PORT,
		DATABASE: process.env.MONGOOSE_DB_NAME,
	},
	TOKEN: {
		ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
		REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
	},
	ENV: process.env.NODE_ENV || "development",
	USER: {
		EMAIL: process.env.EMAIL,
		PASS_EMAIL: process.env.PASS_EMAIL,
	},
	AWS: {
		AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
		AWS_BUCKET_REGION: process.env.AWS_BUCKET_REGION,
		AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
		AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
	},
	DROPBOX: {
		DROPBOX_ACCESS_TOKEN: process.env.DROPBOX_ACCESS_TOKEN,
	},

	get HttpUrl() {
		return `${this.BASE.HOSTNAME}:${this.BASE.PORT}`;
	},

	get DBUri() {
		return (
			this.DB.URL ||
			`mongodb://${this.DB.HOST}:${this.DB.PORT}/${this.DB.DATABASE}`
		);
	},
};

module.exports = config;
