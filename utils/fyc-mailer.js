const nodemailer = require("nodemailer");

/**
 * mailer for forgot-password and others
 */
const fycmailer = nodemailer.createTransport({
	/**
	 * This fake account was generated on https://ethereal.email/ for testing purposes.
	 */
	name: 'smtp.ethereal.email',
	host: 'smtp.ethereal.email',
	port: 587,
	auth: {
		user: 'jared.lynch@ethereal.email',
		pass: 'w64kSZHEyyGkTfJtaz'
	},
	// debug: true,
	// logger: true
});

module.exports = fycmailer;
