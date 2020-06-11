const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const btoa = require("btoa"); // hash
const base64 = require("base-64"); // base64
// Load input validators
const Validator = require("validator");
const isEmpty = require("is-empty");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
// Load models
const User = require("../models/User");
const ResetPending = require("../models/ResetPending");
const VerifyPending = require("../models/VerifyPending");
const Community = require("../models/Community");
const getDistLatlng = require("../utils/latlng-dist");
// mailer
const config = require("../config");
const fycmailer = require("../utils/fyc-mailer");
const makeMailFromTemplate = require("../utils/mail-template");

/**
 * Register a user
 *
 * @route POST api/users/register
 */
router.post("/register", (req, res) => {
	// Form validation
	const {msg, isValid} = validateRegisterInput(req.body);
	// Check validation
	if(!isValid){
		return res.status(400).json(msg);
	}

	User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(user => {
		if(user){
			return res.status(400).json({msg_reg_email: "This email address has already been registered. If you believe this is an error, please contact our support team at support@findyourchurch.org."});
		}
		else{
			if(req.body.is_organization){
				User.findOne({organization_name: req.body.organization_name}).then(user => {
					if(user){
						return res.status(400).json({msg_reg_organization_name: "This organization name has already been registered. If you believe this is an error, please contact our support team at support@findyourchurch.org."});
					}
					else{
						const newUser = new User({
							fname: req.body.fname,
							lname: req.body.lname,
							email: req.body.email.toLowerCase(),
							admin_email: req.body.email,
							password: req.body.password,
							is_organization: req.body.is_organization,
							organization_name: req.body.organization_name,
							zip_code: req.body.zip_code,
							location: req.body.location,
						});
						// Hash password before saving in database
						bcrypt.genSalt(10, (err, salt) => {
							bcrypt.hash(newUser.password, salt, (err, hash) => {
								if(err) throw err;
								newUser.password = hash;
								newUser
									.save()
									.then(user => {
										// send a mail to verify
										const key = "VE" + base64.encode(btoa(new Date().toISOString()) + btoa(user.email) + btoa(user.registered_at.toString()));
										const verify_link = config.FRONT_URL + '/verify-email/' + key;

										// Add new pending to verify email
										const newPending = new VerifyPending({
											key: key,
											email: req.body.email.toLowerCase(),
										});
										newPending
											.save()
											.then(() => {
												// preparing the mail contents...
												const mailOptions = {
													from: config.MAIL_SENDER,
													to: req.body.email,
													subject: 'Welcome to everydaybelievers.com',
													html: makeMailFromTemplate({
														header: 'Welcome to everydaybelievers.com!',
														title: 'Click the button below to confirm your email.',
														content: 'If you believe you received this email in error, please delete it and/or contact our support team if you wish to troubleshoot further.',
														link: verify_link,
														button_text: 'Confirm email',
														extra: '',
													}),
												};

												// send it!
												fycmailer.sendMail(mailOptions, function(err, info){
													if(err){
													}
													else{
														console.log("Sent a mail to verify the user email.")
													}
												});
											})
											.catch(err => console.log(err));

										res.status(200).json({
											msg_register: "Your organization account has been created successfully."
										});
									})
									.catch(err => console.log(err));
							});
						});
					}
				});
			}
			else{
				const newUser = new User({
					fname: req.body.fname,
					lname: req.body.lname,
					email: req.body.email.toLowerCase(),
					admin_email: req.body.email,
					password: req.body.password,
				});
				// Hash password before saving in database
				bcrypt.genSalt(10, (err, salt) => {
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if(err) throw err;
						newUser.password = hash;
						newUser
							.save()
							.then(user => {
								res.status(200).json({
									msg_register: "Your account has been created successfully."
								});
							})
							.catch(err => console.log(err));
					});
				});
			}
		}
	});
});

/**
 * api - google user register
 */
router.post("/googleregister", (req, res) => {
	User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(user => {
		if(user){
			return res.status(400).json({email: "Email already exists"});
		}
		else{
			const newUser = new User({
				fname: req.body.fname,
				lname: req.body.lname,
				email: req.body.email.toLowerCase(),
				password: "",
				google_id: req.body.google_id
			});
			newUser
				.save()
				.then(user => res.json(user))
				.catch(err => console.log(err));
		}
	});
});

/**
 * Login
 */
router.post("/login", (req, res) => {
	// Form validation
	const {msg, isValid} = validateLoginInput(req.body);
	// Check validation
	if(!isValid){
		return res.status(400).json(msg);
	}
	const email = req.body.email;
	const password = req.body.password;

	// Find user by email
	User.findOne({email: {$regex: new RegExp(`^${email}$`, 'i')}}).then(user => {
		// Check if user exists
		if(!user){
			return res.status(400).json({msg_login_email: "Email not found"});
		}
		else{
			// Check password
			bcrypt.compare(password, user.password).then(isMatch => {
				if(isMatch){ // User matched
					// Create JWT Payload
					const payload = {
						id: user.id,
						fname: user.fname,
						lname: user.lname,
						location: user.location,
						email: user.email.toLowerCase(),
						registered_at: user.registered_at,
					};

					// Sign token
					jwt.sign(
						payload,
						config.SECRET_KEY,
						{
							expiresIn: 31556926 // 1 year in seconds
						},
						(err, token) => {
							res.status(200).json({
								msg_login: "welcome to FindYourChurch.org",
								token: "Bearer " + token,
							});
						}
					);
				}
				else{
					return res.status(400).json({msg_login_password: "Password incorrect"});
				}
			});
		}
	});
});

/**
 * get user info
 * @req.body.user_id user id to get the information for.
 */
router.post("/userinfo", (req, res) => {
	User.findOne({_id: req.body.user_id}, '-password -google_id -facebook_id -tickets -ticket_expiry').then(user => {
		if(user){
			VerifyPending.findOne({email: {$regex: new RegExp(`^${user.email}$`, 'i')}}, '-email -key').sort({pended_at: 'desc'}).then(pending => {
				if(pending){
					return res.status(200).json({
						...user._doc,
						pended_at: pending.pended_at,
					});
				}
				else{
					return res.status(200).json({
						...user._doc,
						pended_at: null,
					});
				}
			});
		}
		else{
			return res.status(404).json({msg_info: "The user not found."});
		}
	});
});

router.post("/googlelogin", (req, res) => {
	const payload = {
		id: req.body.social_token,
	};

	// Sign token
	jwt.sign(
		payload,
		config.SECRET_KEY,
		{
			expiresIn: 86400 // 1 day in seconds
		},
		(err, token) => {
			res.json({
				success: true,
				token: "Bearer " + token
			});
		}
	);
});

router.post("/resetpassword", (req, res) => {
	// check the email's validation
	let msg = '';
	if(Validator.isEmpty(req.body.email)){
		msg = "Email field is required";
	}
	else if(!Validator.isEmail(req.body.email)){
		msg = "Email is invalid";
	}
	if(!isEmpty(msg)){
		return res.status(400).json({msg_reset: msg});
	}

	// generate new password
	let user = {
		link: config.FRONT_URL + '/reset-password/',
	};
	User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(usr => {
		if(usr){
			user.fname = usr.fname;
			const link_key = base64.encode(btoa(usr.email) + btoa(usr.registered_at.toString()) + btoa(Date.now().toString()));
			user.link += link_key;

			// Add new pending to reset the password
			const newPending = new ResetPending({
				key: link_key,
				email: req.body.email.toLowerCase(),
			});
			newPending
				.save()
				.then(() => {
					// preparing the mail contents...
					const mailOptions = {
						from: config.MAIL_SENDER,
						to: req.body.email,
						subject: 'You requested to reset your password.',
						html: makeMailFromTemplate({
							header: 'You requested to reset your password.',
							title: 'Click the link below to reset your password.',
							content: 'If you believe you received this email in error, please delete it and/or contact our support team if you wish to troubleshoot further.',
							link: user.link,
							button_text: 'Create a new password',
							extra: '',
						}),
					};

					// send it!
					fycmailer.sendMail(mailOptions, function(err, info){
						if(err){
							console.log(`send mail failed: ${err}`);
							return res.status(400).json({msg_reset: err});
						}
						else{
							console.log("sent a mail.");
							return res.status(200).json({
								msg_reset: "Success! To continue, check your mail in " + config.PENDING_EXPIRATION / 1000 + " seconds"
							});
						}
					});
				})
		}
		else{
			return res.status(400).json({msg_reset: "The email address is not exist"});
		}
	});
});

/**
 * generate a random password.
 *
 * @returns {string}
 */
const generateRandomString = () => {
	let result = '';
	const char_set = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const char_set_len = char_set.length;
	for(let i = 0; i < config.PASSWORD_LENGTH; i++){
		result += char_set.charAt(Math.floor(Math.random() * char_set_len));
	}
	return result;
};

/**
 * reset password, and it's also just process of email verification.
 */
router.post("/doresetpassword", (req, res) => {
	ResetPending.findOne({key: req.body.key}).then(pending => {
		if(pending){
			const t1 = pending.pended_at;
			const t2 = new Date(Date.now());
			const diff = t2.getTime() - t1.getTime() - config.PENDING_EXPIRATION; // in milliseconds
			if(diff > 0){ // if expired
				// remove it from pending list.
				pending.remove();

				// and send "expired" message.
				return res.status(400).json({error: `Your request is expired ${Math.round(diff / 1000)} seconds ago.`});
			}
			else{
				// Now, gonna reset the password.
				User.findOne({email: {$regex: new RegExp(`^${pending.email}$`, 'i')}}).then(usr => { // find a user related to this pending
					if(usr){ // if existed
						// preparing of new password
						const new_password = generateRandomString();
						usr.password = new_password;

						// hash it, then...
						bcrypt.genSalt(10, (err, salt) => {
							bcrypt.hash(usr.password, salt, (err, hash) => {
								if(err){ // if errors, return with error.
									return res.status(500).json({email: "Your password was not reset."});
								}

								// DO reset the password newly!
								usr.password = hash; // ... with hashed value
								usr.email_verified = true; // this email was verified.
								usr.email_verified_at = new Date(Date.now());
								usr
									.save()
									.then(() => {
										// remove it from pending list.
										const to_email = pending.email;
										pending.remove();

										// preparing the mail contents...
										const mailOptions = {
											from: config.MAIL_SENDER,
											to: to_email,
											subject: 'Your password has successfully been updated',
											html: makeMailFromTemplate({
												header: 'Success!',
												title: 'Your password has successfully been updated.',
												content: 'If you believe you received this email in error, please delete it and/or contact our <a href="mailto:support@everydaybelievers.com">support team</a> if you wish to troubleshoot further.<p style="background-color: #888; padding: 10px 16px; color: #888;">\n' +
													'${new_password}\n' +
													'</p>',
												link: config.FRONT_URL,
												button_text: 'Go to my dashboard',
												extra: '',
											}),
										};

										// send it!
										fycmailer.sendMail(mailOptions, function(err, info){
											if(err){
												console.log(`send mail failed: ${err}`);
												res.status(400).json(err);
											}
											else{
												console.log("sent a mail with new password.");
												res.json({
													success: true,
													info: info
												});
											}
										});

										// return with "success" message.
										return res.status(400).json({
											success: true,
											error: `You did it! Please check another mail including your new password now.`
										});
									})
									.catch(err => res.status(400).json({error: `Error: '${err}'.`}));
							});
						});
					}
					else{
						return res.status(500).json({error: "Oh, no. Your password was not reset."});
					}
				});
			}
		}
		else{
			return res.status(400).json({error: "Oh, no. Your request is invalid."});
		}
	});
});

router.post("/changepassword", (req, res) => {
	// check the email's validation
	let msg = '';
	if(Validator.isEmpty(req.body.email)){
		msg = "Email address is required.";
	}
	else if(!Validator.isEmail(req.body.email)){
		msg = "Email is invalid.";
	}
	if(!isEmpty(msg)){
		return res.status(400).json({msg_change: msg});
	}

	// generate new password
	User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(async user => {
		if(user){
			const key = base64.encode(btoa(Date.now().toString()) + btoa(user.email) + btoa(user.registered_at.toString()));
			const password_link = config.FRONT_URL + '/change-password/' + key;

			await ResetPending.deleteMany({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}});
			// Add new pending to reset the password
			const newPending = new ResetPending({
				key: key,
				email: req.body.email.toLowerCase(),
			});
			return newPending
				.save()
				.then(() => {
					// preparing the mail contents...
					const mailOptions = {
						from: config.MAIL_SENDER,
						to: req.body.email,
						subject: 'You requested to reset your password',
						html: makeMailFromTemplate({
							header: 'You requested to reset your password.',
							title: 'Click the link below to reset your password.',
							content: 'If you believe you received this email in error, please delete it and/or contact our <a href="mailto:support@everydaybelievers.com">support team</a> if you wish to troubleshoot further.',
							link: password_link,
							button_text: 'Create a new password',
							extra: '',
						}),
					};

					// send it!
					return fycmailer.sendMail(mailOptions, function(err, info){
						if(err){
							return res.status(400).json({msg_change: err.toString()});
						}
						else{
							return res.status(200).json({
								msg_change: `Success! We just sent an email to ${req.body.email}.`
							});
						}
					});
				})
				.catch(err => {
					return res.status(400).json({msg_change: err.toString()});
				});
		}
		else{
			return res.status(400).json({msg_change: "The email address is not exist"});
		}
	});
});

router.post("/dochangepassword", (req, res) => {
	if(req.body.password !== req.body.password2){
		return res.status(400).json({msg: "Passwords mismatch!"});
	}
	else if(isEmpty(req.body.password)){
		return res.status(400).json({msg: "Password cannot be empty."});
	}
	else{
		ResetPending.findOne({key: req.body.key}).then(pending => {
			if(pending){
				const t1 = pending.pended_at;
				const t2 = new Date(Date.now());
				const diff = t2.getTime() - t1.getTime() - config.PENDING_EXPIRATION; // in milliseconds
				if(diff > 0){ // if expired
					// remove it from pending list.
					pending.remove();

					// and send "expired" message.
					return res.status(400).json({msg: `Your request was expired ${Math.round(diff / 1000)} seconds ago.`});
				}
				else{
					// Now, gonna reset the password.
					User.findOne({email: {$regex: new RegExp(`^${pending.email}$`, 'i')}}).then(user => { // find a user related to this pending
						if(user){ // if existed
							console.log(pending.email, user.fname, user.lname);
							// preparing of new password
							user.password = req.body.password;

							// hash it, then...
							bcrypt.genSalt(10, (err, salt) => {
								bcrypt.hash(user.password, salt, (err, hash) => {
									if(err){ // if errors, return with error.
										return res.status(500).json({msg: "Has function was corrupted."});
									}

									// DO reset the password newly!
									user.password = hash; // ... with hashed value
									user.email_verified = true; // this email was verified.
									user.email_verified_at = new Date(Date.now());
									user
										.save()
										.then(() => {
											// remove it from pending list.
											pending.remove();

											// return with "success" message.
											return res.status(200).json({
												msg: `Success! Your password has been changed. Sign in now.`,
											});
										})
										.catch(err => res.status(400).json({msg: `Error: '${err}'.`}));
								});
							});
						}
						else{
							return res.status(500).json({msg: "Oh, no. Unknown internal server error."});
						}
					});
				}
			}
			else{
				return res.status(400).json({msg: "Oops, your request is invalid."});
			}
		});
	}
});

router.post("/verifyemail", (req, res) => {
	// check the email's validation
	let errors = {};
	if(Validator.isEmpty(req.body.email)){
		errors.msg_verify = "What do you want to verify?";
	}
	else if(!Validator.isEmail(req.body.email)){
		errors.msg_verify = "Email is invalid.";
	}
	if(!isEmpty(errors)){
		return res.status(400).json(errors);
	}

	// generate new password
	User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(user => {
		if(user){
			const key = "VE" + base64.encode(btoa(new Date().toISOString()) + btoa(user.email) + btoa(user.registered_at.toString()));
			const verify_link = config.FRONT_URL + '/verify-email/' + key;

			// Add new pending to reset the password
			const newPending = new VerifyPending({
				key: key,
				email: req.body.email.toLowerCase(),
			});
			newPending
				.save()
				.then(() => {
					// preparing the mail contents...
					const mailOptions = {
						from: config.MAIL_SENDER,
						to: req.body.email,
						subject: 'Please verify email address',
						html: makeMailFromTemplate({
							header: 'Welcome to everydaybelievers.com!',
							title: 'Click the button below to confirm your email.',
							content: 'If you believe you received this email in error, please delete it and/or contact our support team if you wish to troubleshoot further.',
							link: verify_link,
							button_text: 'Confirm email',
							extra: '',
						}),
					};

					// send it!
					fycmailer.sendMail(mailOptions, function(err, info){
						if(err){
							console.log(`send mail failed: ${err}`);
							return res.status(400).json({
								msg_verify: `Oops! ${err}`
							});
						}
						else{
							console.log("sent a mail.");
							return res.status(200).json({
								msg_verify: `Success! Click the link in the email we just sent you to verify your email!`,
							});
						}
					});
				})
				.catch(err => console.log(err));
		}
		else{
			return res.status(400).json({msg_verify: "The email address is not exist"});
		}
	});
});

router.post("/doverifyemail", (req, res) => {
	VerifyPending.findOne({key: req.body.key}).then(pending => {
		if(pending){
			const t1 = pending.pended_at;
			const t2 = new Date(Date.now());
			const diff = t2.getTime() - t1.getTime() - config.VERIFY_EXPIRATION; // in milliseconds
			if(diff > 0){ // if expired
				// remove it from pending list.
				pending.remove();

				// and send "expired" message.
				return res.status(400).json({msg_verify: `Your request was expired ${Math.round(diff / 1000)} seconds ago.`});
			}
			else{
				// Now, gonna reset the password.
				User.findOne({email: {$regex: new RegExp(`^${pending.email}$`, 'i')}}).then(user => { // find a user related to this pending
					if(user){ // if existed
						user.email_verified = true;
						user.email_verified_at = new Date(Date.now());
						user
							.save()
							.then(() => {
								// remove it from pending list.
								pending.remove();

								// return with "success" message.
								return res.status(200).json({
									msg_verify: `Success! Your email has been verified. Please sign in. If signed in, just continue please.`,
								});
							})
							.catch(err => res.status(400).json({msg_verify: `Error: '${err}'.`}));
					}
					else{
						return res.status(500).json({msg_verify: "Oh, no. Unknown internal server error."});
					}
				});
			}
		}
		else{
			return res.status(400).json({msg_verify: "Oops, your request is invalid."});
		}
	});
});

/**
 * req.body {
 *     @email
 *     @to_email
 *     @community_id
 * }
 */
router.post("/sharecommunity", (req, res) => {
	// check the email's validation
	let errors = {};
	if(Validator.isEmpty(req.body.to_email)){
		errors.msg_share = "Whom do you want send to?";
	}
	else if(!Validator.isEmail(req.body.to_email)){
		errors.msg_share = "Email is invalid.";
	}
	if(!isEmpty(errors)){
		return res.status(400).json(errors);
	}

	const share_link = config.FRONT_URL + '/view-community/' + req.body.community_id;
	const mailOptions = {
		from: `FindYourChurch <${req.body.email}>`,
		to: req.body.to_email,
		subject: 'FindYourChurch: I suggest this community.',
		html: `
				<h2>Hi</h2>
				<h4>This is a my favorite community.</h4>
				My suggestion:
				<p>
					<a href="${share_link}">${share_link}</a>
				</p>
			`
	};

	// send it!
	fycmailer.sendMail(mailOptions, function(err, info){
		if(err){
			console.log(`send mail failed: ${err}`);
			return res.status(400).json({
				share_link: `Oops! ${err}`
			});
		}
		else{
			console.log("sent a mail.");
			return res.status(200).json({
				share_link: `Success!`,
			});
		}
	});
});

/**
 * req.body {
 *     @id
 *     @email
 *     @community_id
 *     @community_name
 * }
 */
router.post("/reportcommunity", (req, res) => {
	// check the email's validation
	let errors = {};
	if(Validator.isEmpty(req.body.email)){
		errors.msg_report = "Sender email is empty";
	}
	else if(!Validator.isEmail(req.body.email)){
		errors.msg_report = "Email is invalid.";
	}
	if(!isEmpty(errors)){
		return res.status(400).json(errors);
	}

	const report_link = config.FRONT_URL + '/view-community/' + req.body.community_id;
	const mailOptions = {
		from: `#${req.body.id} <${req.body.email}>`,
		to: 'support@findyourchurch.com',
		subject: 'COMMUNITY REPORTED',
		html: `
				<h2>${req.body.community_name}</h2>
				<h4>I report this community.</h4>
				<p>
					<a href="${report_link}">${report_link}</a>
				</p>
			`
	};

	// send it!
	fycmailer.sendMail(mailOptions, function(err, info){
		if(err){
			console.log(`send mail failed: ${err}`);
			return res.status(400).json({
				msg_report: `Oops! ${err}`
			});
		}
		else{
			console.log("sent a mail.");
			return res.status(200).json({
				msg_report: `Success!`,
			});
		}
	});
});

router.post("/getowners", (req, res) => {
	const keyword = req.body.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regexp_criteria = {$regex: keyword, $options: "i"};

	User.find({
		$or: [
			{fname: regexp_criteria},
			{lname: regexp_criteria},
			{phone: regexp_criteria},
			{admin_email: regexp_criteria},
			{organization_name: regexp_criteria},
		]
	}, 'fname lname phone admin_email is_organization organization_name').then(users => {
		let owners = [];
		for(const user of users){
			const owner_info = {
				title: `${user.is_organization ? user.organization_name : `${user.fname} ${user.lname}`}`,
				contact: `${user.admin_email === undefined ? user.email : user.admin_email}${isEmpty(user.phone) ? "" : `, ${user.phone}`}`,
				value: user._id,
			};
			owners.push(owner_info);
		}
		console.log("searched owners:", owners.length);
		return res.status(200).json(owners);
	});
});

/**
 * search criteria:
 req.body {
  category: 'Church',
  radius: 1,
  address: '',
  lat: 51.8750969,
  lng: -0.3982276,
  filter: {
    days: '0000000',
    times: '000',
    frequency: '00000',
    hosting: '00',
    ages: '00000000000',
    gender: '000',
    kids_welcome: '00',
    parking: '00000',
    ministries: '0000000',
    other_services: '000000',
    ambiance: '0000',
    event_type: '00000000',
    support_type: '00000'
  }
}

 */

const filter_length = {
	days: 7,
	times: 3,
	hosting: 2,
	ages: 11,
	parking: 5,
	ministries: 7,
	other_services: 6,

	frequency: 5,
	gender: 4,
	kids_welcome: 2,
	ambiance: 4,
	event_type: 8,
	support_type: 5,
};
const filters1 = ['days', 'times', 'hosting', 'ages', 'parking', 'ministries', 'other_services'];
const filters2 = ['frequency', 'gender', 'kids_welcome', 'ambiance', 'event_type', 'support_type'];
router.post("/search", (req, res) => {
	console.log('search criteria:', req.body);

	let results = [];
	let categories = [];
	let counts = {
		days: [], // 0 - (filter['days'].length - 1)
		times: [],
		hosting: [],
		ages: [],
		parking: [],
		ministries: [],
		other_services: [],

		frequency: [],
		gender: [],
		kids_welcome: [],
		ambiance: [],
		event_type: [],
		support_type: [],
	};

	// initialize counters
	const keys = Object.keys(counts);
	for(const key of keys){
		// comm[key] -> 001010
		counts[key] = new Array(req.body.filter[key].length).fill(0);
	}

	const base_criteria = req.body.filter.owner_id === undefined || req.body.filter.owner_id === '' ? {
		activated: true,
	} : {
		activated: true,
		owner_id: req.body.filter.owner_id,
	};

	console.log('base criteria:', base_criteria);

	Community.find(base_criteria).then(comms => {
		for(let comm of comms){
			if(isEmpty(comm.coordinate))
				continue;

			const lat = comm.coordinate ? comm.coordinate.lat : 0;
			const lng = comm.coordinate ? comm.coordinate.lng : 0;
			const dist = Math.round(getDistLatlng(req.body.lat, req.body.lng, lat, lng));

			if(req.body.owner !== null && req.body.owner !== undefined){
				if(req.body.owner !== comm.owner_id)
					continue;
			}

			if(dist > (req.body.radius === null ? 5000 : req.body.radius))
				continue;

			// check the category
			if(!categories.includes(comm.category)){
				categories.push(comm.category);
			}

			if(!isEmpty(req.body.category) && comm.category !== req.body.category)
				continue;

			// filtering
			let is_passed = true;
			for(const filter1 of filters1){
				if(!is_passed)
					continue;
				const dat_filter = comm[filter1] === undefined ? '0'.repeat(filter_length[filter1]) : comm[filter1];
				const dat1_value = parseInt(dat_filter, 2);
				const pat1_value = parseInt(req.body.filter[filter1], 2);
				if(pat1_value === 0)
					continue;
				if((dat1_value & pat1_value) !== pat1_value){
					is_passed = false;
				}
			}

			if(is_passed){
				for(const filter2 of filters2){
					if(!is_passed)
						continue;
					const pat2_value = parseInt(req.body.filter[filter2], 2);
					if(pat2_value === 0)
						continue;

					let dat_filter = comm[filter2] === undefined ? '0'.repeat(filter_length[filter2]) : comm[filter2];
					if(req.body.filter[filter2].length !== dat_filter.length){
						// console.log("old format", req.body.filter[filter2], dat_filter);
						dat_filter = dat_filter + "0";
					}

					const dat2_value = parseInt(dat_filter, 2);
					if(dat2_value !== pat2_value){
						is_passed = false;
					}
				}
			}

			// is this comm countable for each filter item?
			if(is_passed){
				for(const key of keys){
					if(comm[key] === undefined)
						continue;

					// comm[key] -> 001010
					const values = comm[key].split("");
					for(let i = 0; i < values.length; i++){
						if(values[i] === "1")
							counts[key][i]++;
					}
				}
			}

			if(is_passed){
				results.push({dist: dist, data: comm});
			}
		}

		console.log(results.length);

		return res.status(200).json({results: results, counts: counts, categories: categories});
	});
});

router.post("/viewCommunity", (req, res) => {
	console.log(req.body);
	Community.findOne({_id: req.body.id}).then(comm => {
		return res.status(200).json(comm);
	});
});

module.exports = router;
