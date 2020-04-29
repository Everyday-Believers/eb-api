module.exports = {
	TRIAL_PERIOD: 1, // free trial period
	PENDING_EXPIRATION: 300000, // in milliseconds
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
	FRONT_URL: "https://develop.findyourchurch.org", // process.env.FRONT_URL,

	/**
	 * TODO: must be replaced for production
	 * FindYourChurch Mailer
	 * This fake account was generated on https://ethereal.email/ for testing purposes.
	 */
	MAIL_SG_API: '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',
	MAIL_SENDER: 'FindYourChurch <dont-reply@findyourchurch.org>',

	/**
	 * TODO: must be replaced for production
	 * Secret key for Stripe payment.
	 * This key must be only here securely.
	 *
	 * DO NOT SHARE THIS KEY EXTERNALLY.
	 * Publishable key: pk_live_nPL4q6SyxeqSknHK2Hs3wHta
	 */
	STRIPE_SK: "sk_test_TfCg96voiaBUAmLg9odvjT7y", // of findyourchurch.org
	SUBSCRIBER_MONTHLY_PLAN: "plan_FKP4sKe1DC6uMP", // can use this for the production?
};
