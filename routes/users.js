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
// mailer
const config = require("../config");
const fycmailer = require("../utils/fyc-mailer");

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

	User.findOne({email: req.body.email}).then(user => {
		if(user){
			return res.status(400).json({msg_reg_email: "Email was already registered."});
		}
		else{
			const newUser = new User({
				fname: req.body.fname,
				lname: req.body.lname,
				email: req.body.email,
				admin_email: req.body.email,
				password: req.body.password
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
								const key = "VE" + base64.encode(btoa(Date.now().toString()) + btoa(user.email) + btoa(user.registered_at.toString()));
								const verify_link = config.FRONT_URL + '/verify-email/' + key;

								// Add new pending to verify email
								/*
								const newPending = new VerifyPending({
									key: key,
									email: req.body.email,
								});
								newPending
									.save()
									.then(() => {
										// preparing the mail contents...
										const mailOptions = {
											from: "FindYourChurch <dont-reply@findyourchurch.com>",
											to: req.body.email,
											subject: 'FindYourChurch: Verify your email please.',
											html: `
													<h2>Hi, ${user.fname}</h2>
													<h4>Thank you for signing up.</h4>
													To verify your account, click:
													<p>
														<a href="${verify_link}">${verify_link}</a>
													</p>
												`
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
								*/

								res.status(200).json({
									msg_register: "Success! Click the link in the email we just sent you to verify your email."
								});
							})
							.catch(err => console.log(err));
				});
			});
		}
	});
});

/**
 * api - google user register
 */
router.post("/googleregister", (req, res) => {
	User.findOne({email: req.body.email}).then(user => {
		if(user){
			return res.status(400).json({email: "Email already exists"});
		}
		else{
			const newUser = new User({
				fname: req.body.fname,
				lname: req.body.lname,
				email: req.body.email,
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
	User.findOne({email: email}).then(user => {
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
						email: user.email,
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
			VerifyPending.findOne({email: user.email}, '-email -key').sort({pended_at: 'desc'}).then(pending => {
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
	User.findOne({email: req.body.email}).then(usr => {
		if(usr){
			user.fname = usr.fname;
			const link_key = base64.encode(btoa(usr.email) + btoa(usr.registered_at.toString()) + btoa(Date.now().toString()));
			user.link += link_key;

			// Add new pending to reset the password
			const newPending = new ResetPending({
				key: link_key,
				email: req.body.email
			});
			newPending
					.save()
					.then(() => {
						// preparing the mail contents...
						const mailOptions = {
							from: "FindYourChurch <dont-reply@findyourchurch.com>",
							to: req.body.email,
							subject: 'Step 1: Please check this to reset your information',
							html: `
							<h2>Hi, ${user.fname}.</h2>
							<h4>We received your request to reset the password. You can confirm it by clicking the following:</h4>
							<p>
								<a href="${user.link}">${user.link}</a>
							</p>
						`
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
				User.findOne({email: pending.email}).then(usr => { // find a user related to this pending
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
												from: "FindYourChurch <dont-reply@findyourchurch.com>",
												to: to_email,
												subject: 'Step 2: Your password was regenerated.',
												html: `
												<h2>Hi, ${usr.fname}.</h2>
												<h4>Here is your new password in:</h4>
												<p style="background-color: #888; padding: 10px 16px; color: #888;">
													${new_password}
												</p>
												<p>
													Please drag your mouse on the above grey bar to view your new password, 
													and keep it in the secure places.
												</p>
												<p>Thank you.</p>
											`
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

/**
 * Update user information
 * updates:
 * 		fname: first name
 * 		lname: last name
 * 		password: password
 * 		ref_code: referral code
 * 		billing_card: billing card
 * 		billing_zip_code: billing zip code
 */
router.post("/update", (req, res) => {
	// req.body.

	User.findOne({_id: req.body.id}).then(user => {
		if(user){
			if(req.body.fname !== undefined){
				if(isEmpty(req.body.fname)){
					return res.status(400).json({msg_name: "Invalid first name."});
				}
				else if(isEmpty(req.body.lname)){
					return res.status(400).json({msg_name: "Invalid last name."});
				}
				else if(user.fname === req.body.fname && user.lname === req.body.lname){
					return res.status(400).json({msg_name: "Your name was not changed."});
				}

				user.fname = req.body.fname;
				user.lname = req.body.lname;
				user
						.save()
						.then(() => {
							// modified
							return res.status(200).json({msg_name: "Your name has been changed."});
						})
						.catch(() => {
							return res.status(500).json({msg_name: "Database error."});
						});
			}
			else if(req.body.admin_email !== undefined){
				if(isEmpty(req.body.admin_email) && isEmpty(user.phone)){
					return res.status(400).json({msg_admin_email: "Email OR phone is required."});
				}
				else if(!Validator.isEmail(req.body.admin_email) && !isEmpty(req.body.admin_email)){
					return res.status(400).json({msg_admin_email: "Invalid email"});
				}
				else if(user.admin_email === req.body.admin_email){
					return res.status(400).json({msg_admin_email: "Not modified!"});
				}
				else{
					User.findOne({admin_email: req.body.admin_email}).then(usr => {
						if(usr){
							return res.status(400).json({msg_admin_email: "The email was already registered."});
						}
						else{
							user.admin_email = req.body.admin_email;
							user
									.save()
									.then(() => {
										// modified
										return res.status(200).json({msg_admin_email: "Modified!"});
									})
									.catch(() => {
										return res.status(500).json({msg_admin_email: "Database error."});
									});
						}
					});
				}
			}
			else if(req.body.email !== undefined){
				if(isEmpty(req.body.email)){
					return res.status(400).json({msg_email: "You entered empty value."});
				}
				else if(!Validator.isEmail(req.body.email)){
					return res.status(400).json({msg_email: "Invalid email"});
				}
				else if(user.email === req.body.email){
					return res.status(400).json({msg_email: "Not modified!"});
				}
				else{
					User.findOne({email: req.body.email}).then(usr => {
						if(usr){
							return res.status(400).json({msg_email: "The email was already registered."});
						}
						else{
							user.email = req.body.email;
							user.email_verified = false;
							user
									.save()
									.then(() => {
										// modified
										return res.status(200).json({msg_email: "Modified!"});
									})
									.catch(() => {
										return res.status(500).json({msg_email: "Database error."});
									});
						}
					});
				}
			}
			else if(req.body.pic !== undefined){
				if(isEmpty(req.body.pic)){
					return res.status(400).json({msg_pic: "Empty data."});
				}
				else if(user.pic === req.body.pic){
					return res.status(200).json({msg_pic: "Not modified!"});
				}
				else{
					user.pic = req.body.pic;
					user
							.save()
							.then(() => {
								// modified
								return res.status(200).json({msg_pic: "Modified!"});
							})
							.catch(() => {
								return res.status(500).json({msg_pic: "Database error."});
							});
				}
			}
			else if(req.body.phone !== undefined){
				if(isEmpty(req.body.phone) && isEmpty(user.admin_email)){
					return res.status(400).json({msg_phone: "Email OR phone is required."});
				}
				else if(!Validator.isMobilePhone(req.body.phone) && !isEmpty(req.body.phone)){
					return res.status(400).json({msg_phone: "Invalid phone number"});
				}
				else if(user.phone === req.body.phone){
					return res.status(200).json({msg_phone: "Not modified!"});
				}
				else{
					User.findOne({phone: req.body.phone}).then(usr => {
						if(usr){
							return res.status(400).json({msg_phone: "The phone number was already registered."});
						}
						else{
							user.phone = req.body.phone;
							user
									.save()
									.then(() => {
										// modified
										return res.status(200).json({msg_phone: "Modified!"});
									})
									.catch(() => {
										return res.status(500).json({msg_phone: "Database error."});
									});
						}
					});
				}
			}
			else if(req.body.password !== undefined){
				if(isEmpty(req.body.password)){
					return res.status(400).json({msg_password: "Password cannot be empty."});
				}
				else if(req.body.password !== req.body.password2){
					return res.status(400).json({msg_password: "Passwords not matched."});
				}
				else{
					// Hash password before saving in database
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(req.body.password, salt, (err, hash) => {
							if(err){
								return res.status(400).json({msg_password: err});
							}
							user.password = hash;
							user
									.save()
									.then(() => {
										// modified
										return res.status(200).json({msg_password: "Your password has been modified."});
									})
									.catch(() => {
										return res.status(500).json({msg_password: "Database error."});
									});
						});
					});
				}
			}
			else if(req.body.ref_code !== undefined){
				if(isEmpty(req.body.ref_code)){
					return res.status(400).json({msg_ref_code: "You entered empty value."});
				}
				else if(user.ref_code === req.body.ref_code){
					return res.status(400).json({msg_ref_code: "Not modified!"});
				}
				else if(req.body.ref_code.length < 6){
					return res.status(400).json({msg_ref_code: "Must be at least 6 characters."});
				}
				else{
					User.findOne({ref_code: req.body.ref_code}).then(usr => {
						if(usr){
							return res.status(400).json({msg_ref_code: "The code was duplicated with other."});
						}
						else{
							user.ref_code = req.body.ref_code;
							user
									.save()
									.then(() => {
										// modified
										return res.status(200).json({msg_ref_code: "Modified!"});
									})
									.catch(() => {
										return res.status(500).json({msg_ref_code: "Database error."});
									});
						}
					});
				}
			}
		}
		else{
			return res.status(400).json({msg_email: "Sorry, your email was not registered."});
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
	User.findOne({email: req.body.email}).then(user => {
		if(user){
			const key = base64.encode(btoa(Date.now().toString()) + btoa(user.email) + btoa(user.registered_at.toString()));
			const password_link = config.FRONT_URL + '/change-password/' + key;

			// Add new pending to reset the password
			const newPending = new ResetPending({
				key: key,
				email: req.body.email,
			});
			newPending
					.save()
					.then(() => {
						// preparing the mail contents...
						const mailOptions = {
							from: "FindYourChurch <dont-reply@findyourchurch.com>",
							to: req.body.email,
							subject: 'FindYourChurch: Forgot password?',
							html: `
							<h2>Hi, ${user.fname}</h2>
							<h4>We received your request to change the password.
							 You can continue it by clicking the following:</h4>
							<p style="max-width: 100%;">
								<a href="${password_link}">${password_link}</a>
							</p>
						`
						};

						res.status(200).json({
							msg_change: `Success! We just sent an email to ${req.body.email}.`
						});

						// send it!
						fycmailer.sendMail(mailOptions, function(err, info){
							if(err){
								console.log(`send mail failed: ${err}`);
								return res.status(400).json({msg_change: err});
							}
							else{
								console.log("sent a mail.");
							}
						});
					})
					.catch(err => console.log(err));
		}
		else{
			return res.status(400).json({msg: "The email address is not exist"});
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
					User.findOne({email: pending.email}).then(user => { // find a user related to this pending
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
	User.findOne({email: req.body.email}).then(user => {
		if(user){
			const key = "VE" + base64.encode(btoa(Date.now().toString()) + btoa(user.email) + btoa(user.registered_at.toString()));
			const verify_link = config.FRONT_URL + '/verify-email/' + key;

			// Add new pending to reset the password
			const newPending = new VerifyPending({
				key: key,
				email: req.body.email,
			});
			newPending
					.save()
					.then(() => {
						// preparing the mail contents...
						const mailOptions = {
							from: "FindYourChurch <dont-reply@findyourchurch.com>",
							to: req.body.email,
							subject: 'FindYourChurch: Verify your email please.',
							html: `
							<h2>Hi, ${user.fname}</h2>
							<h4>Thank you for verification</h4>
							To continue, just click:
							<p style="max-width: 100%;">
								<a href="${verify_link}">${verify_link}</a>
							</p>
						`
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
	console.log(req.body);
	VerifyPending.findOne({key: req.body.key}).then(pending => {
		if(pending){
			const t1 = pending.pended_at;
			const t2 = new Date(Date.now());
			const diff = t2.getTime() - t1.getTime() - config.PENDING_EXPIRATION; // in milliseconds
			if(diff > 0){ // if expired
				// remove it from pending list.
				pending.remove();

				// and send "expired" message.
				return res.status(400).json({msg_verify: `Your request was expired ${Math.round(diff / 1000)} seconds ago.`});
			}
			else{
				// Now, gonna reset the password.
				User.findOne({email: pending.email}).then(user => { // find a user related to this pending
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

module.exports = router;
