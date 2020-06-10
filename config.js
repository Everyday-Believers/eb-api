module.exports = {
	TRIAL_PERIOD: 1, // free trial period
	PENDING_EXPIRATION: 172800000, // 48 hours in milliseconds
	VERIFY_EXPIRATION: 172800000, // 48 hours in milliseconds
	PASSWORD_LENGTH: 20, // length of generated password

	/**
	 * MongoDB URL from system environment variable "MONGO_URL".
	 */
	MONGO_URL: process.env.MONGO_URL,

	/**
	 * Secret key for JWT
	 */
	SECRET_KEY: process.env.JWT_KEY,

	/**
	 * This setting is used only for the content of the mails with link to ... (in forgot-password)
	 */
	FRONT_URL: process.env.FRONT_URL,

	/**
	 * TODO: must be replaced for production
	 * FindYourChurch Mailer
	 */
	MAIL_SG_API: process.env.SEND_GRID_API_KEY,
	MAIL_SENDER: process.env.MAIL_SENDER_ADDRESS,

	/**
	 * TODO: must be replaced for production
	 * Secret key for Stripe payment.
	 * This key must be only here securely.
	 *
	 * DO NOT SHARE THIS KEY EXTERNALLY.
	 */
	STRIPE_SK: process.env.STRIPE_SK,
	SUBSCRIBER_MONTHLY_PLAN: process.env.STRIPE_MONTHLY_PLAN,
};
