const config = require("../config");
const nodemailer = require("nodemailer");

/**
 * mailer for forgot-password and others
 */
const fycmailer = nodemailer.createTransport({
	name: config.MAIL_HOST,
	host: config.MAIL_HOST,
	port: config.MAIL_PORT,
	auth: {
		user: config.MAIL_USER,
		pass: config.MAIL_PASS,
	},
	// debug: true,
	// logger: true
});

module.exports = fycmailer;
