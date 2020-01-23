const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const isEmpty = require("is-empty");
const btoa = require("btoa"); // hash
const base64 = require("base-64"); // base64
const config = require("../config");
// Load input validators
const Validator = require("validator");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
// Load models
const User = require("../models/User");
const ResetPending = require("../models/ResetPending");
// mailer
const fycmailer = require("../utils/fyc-mailer");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
	// Form validation
	const {errors, isValid} = validateRegisterInput(req.body);
	// Check validation
	if(!isValid){
		return res.status(400).json(errors);
	}
	User.findOne({email: req.body.email}).then(user => {
		if(user){
			return res.status(400).json({email: "Email already exists"});
		}
		else{
			const newUser = new User({
				fname: req.body.fname,
				lname: req.body.lname,
				email: req.body.email,
				password: req.body.password
			});
			// Hash password before saving in database
			bcrypt.genSalt(10, (err, salt) => {
				bcrypt.hash(newUser.password, salt, (err, hash) => {
					if(err) throw err;
					newUser.password = hash;
					newUser
						.save()
						.then(user => res.json(user))
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

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
	// Form validation
	const {errors, isValid} = validateLoginInput(req.body);
	// Check validation
	if(!isValid){
		return res.status(400).json(errors);
	}
	const email = req.body.email;
	const password = req.body.password;

	// Find user by email
	User.findOne({email}).then(user => {
		// Check if user exists
		if(!user){
			return res.status(404).json({emailnotfound: "Email not found"});
		}
		// Check password
		bcrypt.compare(password, user.password).then(isMatch => {
			if(isMatch){
				// User matched
				// Create JWT Payload
				const payload = {
					id: user.id,
					fname: user.fname,
					lname: user.lname,
					email: user.email,
					p_len: user.password.length, // is password's length for displaying on UI (FE).
					ref_code: user.ref_code,
					registered_at: user.registered_at,
					email_verified: user.email_verified,
					email_verified_at: user.email_verified_at,
					billing_card: user.billing_card,
					billing_zip_code: user.billing_zip_code,
				};

				// Sign token
				jwt.sign(
					payload,
					config.SECRET_KEY,
					{
						expiresIn: 31556926 // 1 year in seconds
					},
					(err, token) => {
						res.json({
							success: true,
							token: "Bearer " + token
						});
					}
				);
			}
			else{
				return res
					.status(400)
					.json({passwordincorrect: "Password incorrect"});
			}
		});
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
			expiresIn: 31556926 // 1 year in seconds
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
	let errors = {};
	if(Validator.isEmpty(req.body.email)){
		errors.email = "Email field is required";
	}
	else if(!Validator.isEmail(req.body.email)){
		errors.email = "Email is invalid";
	}
	if(!isEmpty(errors)){
		return res.status(400).json(errors);
	}

	// generate new password
	let user = {
		link: config.FRONT_URL + '/reset/',
	};
	User.findOne({email: req.body.email}).then(usr => {
		if(usr){
			user.fname = usr.fname;
			const link_key = base64.encode(btoa(usr.fname + usr.lname) + btoa(usr.registered_at.toString()) + btoa(Date.now().toString()));
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
							return res.status(400).json({
								success: false,
								email: `Oops! ${err}`
							});
						}
						else{
							console.log("sent a mail.");
							return res.status(400).json({
								success: true,
								email: "Sent it! To continue, check your mail in 60 seconds"
							});
						}
					});
				})
				.catch(err => console.log(err));
		}
		else{
			return res.status(400).json({email: "The email address is not exist"});
		}
	});
});

/**
 * generate a random password.
 *
 * @returns {string}
 */
const generatePassword = () => {
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
						const new_password = generatePassword();
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

	User.findOne({email: req.body.email}).then(user => {
		if(user){
			if(req.body.fname !== undefined){
				if(isEmpty(req.body.fname)){
					return res.status(400).json({msg_name: "Invalid first name."});
				}
				else if(isEmpty(req.body.lname)){
					return res.status(400).json({msg_name: "Invalid last name."});
				}
				else if(user.fname === req.body.fname && user.lname === req.body.lname){
					return res.status(400).json({msg_name: "Your name has been not changed."});
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
					return res.status(200).json({msg_ref_code: "Not modified!"});
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
			else if(req.body.billing_card !== undefined){
				if(isEmpty(req.body.billing_card)){
					return res.status(400).json({msg_billing_card: "You entered empty value."});
				}
				else if(user.billing_card === req.body.billing_card){
					return res.status(200).json({msg_billing_card: "Not modified!"});
				}
				else{
					user.billing_card = req.body.billing_card;
					user
						.save()
						.then(() => {
							// modified
							return res.status(200).json({msg_billing_card: "Modified!"});
						})
						.catch(() => {
							return res.status(500).json({msg_billing_card: "Database error."});
						});
				}
			}
			else if(req.body.billing_zip_code !== undefined){
				if(isEmpty(req.body.billing_zip_code)){
					return res.status(400).json({msg_billing_zip_code: "You entered empty value."});
				}
				else if(user.billing_zip_code === req.body.billing_zip_code){
					return res.status(200).json({msg_billing_zip_code: "Not modified!"});
				}
				else{
					user.billing_zip_code = req.body.billing_zip_code;
					user
						.save()
						.then(() => {
							// modified
							return res.status(200).json({msg_billing_zip_code: "Modified!"});
						})
						.catch(() => {
							return res.status(500).json({msg_billing_zip_code: "Database error."});
						});
				}
			}
		}
		else{
			return res.status(400).json({msg_email: "Sorry, your email was not registered."});
		}
	})
	;
})
;

module.exports = router;
