const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
// Load User model
const User = require("../../models/User");

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
		    console.log(req.body);
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
					lname: user.lname
				};
				// Sign token
				jwt.sign(
					payload,
					keys.secretOrKey,
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
	console.log(req.body.social_token);
	/*
		if (!req.body.social_token) {
			return res.status(400).json({notauthenticated: 'User Not Authenticated'});
		}
	*/
	const payload = {
		id: req.body.social_token,
	};

	// Sign token
	jwt.sign(
		payload,
		keys.secretOrKey,
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

module.exports = router;
