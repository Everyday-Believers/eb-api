module.exports = {
	PENDING_EXPIRATION: 60000, // in milliseconds
	PASSWORD_LENGTH: 20, // length of generated password
	/**
	 * Adjustable configurations
	 */
	FRONT_URL: "http://127.0.0.1:8000", // for the content of the mails with link to ... (in forgot-password)
	secretOrKey: "secret", // db password, which must be complicated.
	mongoURI: "mongodb://127.0.0.1:27017/for-auth", // db url & table
};
