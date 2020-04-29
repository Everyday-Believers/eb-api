const config = require("../config");
const nodeMailer = require("nodemailer");
const sgTransport = require('nodemailer-sendgrid-transport');

/**
 * mailer for forgot-password and others
 */
const fycmailer = nodeMailer.createTransport(sgTransport({
	auth: {
		api_key: config.MAIL_SG_API,
	}
}));

module.exports = fycmailer;
