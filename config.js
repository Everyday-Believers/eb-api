module.exports = {
	PENDING_EXPIRATION: 60000, // in milliseconds
	PASSWORD_LENGTH: 20, // length of generated password

	/**
	 * MongoDB URL from system environment variable "MONGO_URL".
	 */
	MONGO_URL: process.env.MONGO_URL,

	/**
	 * Secret key for JWT
	 */
	SECRET_KEY: "Yw6#ew*7$&fgbFu",

	/**
	 * This setting is used only for the content of the mails with link to ... (in forgot-password)
	 */
	FRONT_URL: process.env.FRONT_URL,
};
