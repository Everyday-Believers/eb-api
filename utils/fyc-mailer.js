const nodemailer = require("nodemailer");
//const smtpTransport = require("nodemailer-smtp-transport");

// preparing of mailer
const fycmailer = nodemailer.createTransport({
	/*
	name: 'smtp.mailtrap.io',
	host: 'smtp.mailtrap.io',
	port: 587,
	auth: {
		user: '4da871999cd654',
		pass: 'ccaa7485ecc078'
	},
	*/
	/**
	 * This fake account was generated on https://ethereal.email/ for testing purposes.
	 */
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
