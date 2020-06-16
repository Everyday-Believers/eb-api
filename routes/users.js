const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
// Load input validators
const Validator = require("validator");
const isEmpty = require("is-empty");
// Load models
const User = require("../models/User");

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
			else if(req.body.is_organization !== undefined){
				user.is_organization = req.body.is_organization;
				user.save()
					.then(() => {
						// modified
						return res.status(200).json({msg_organization_name: "Modified!"});
					})
					.catch(() => {
						return res.status(500).json({msg_organization_name: "Database error."});
					});
			}
			else if(req.body.organization_name !== undefined){
				if(isEmpty(req.body.organization_name)){
					return res.status(400).json({msg_organization_name: "Organization name is required."});
				}
				else if(user.organization_name === req.body.organization_name){
					return res.status(200).json({msg_organization_name: "Not modified!"});
				}
				else{
					User.findOne({organization_name: req.body.organization_name}).then(usr => {
						if(usr){
							return res.status(400).json({msg_organization_name: "The organization name was already registered."});
						}
						else{
							user.organization_name = req.body.organization_name;
							user.save()
								.then(() => {
									// modified
									return res.status(200).json({msg_organization_name: "Modified!"});
								})
								.catch(() => {
									return res.status(500).json({msg_organization_name: "Database error."});
								});
						}
					});
				}
			}
			else if(req.body.colors !== undefined){
				user.colors = req.body.colors;
				user.save()
					.then(() => {
						// modified
						return res.status(200).json({msg_colors: "Modified!"});
					})
					.catch(() => {
						return res.status(500).json({msg_colors: "Database error."});
					});
			}
			else if(req.body.default_category !== undefined){
				user.default_category = req.body.default_category;
				user.save()
					.then(() => {
						// modified
						return res.status(200).json({msg_default_category: "Modified!"});
					})
					.catch(() => {
						return res.status(500).json({msg_default_category: "Database error."});
					});
			}
			else if(req.body.default_radius !== undefined){
				user.default_radius = req.body.default_radius === 'null' ? null : req.body.default_radius;
				user.save()
					.then(() => {
						// modified
						console.log('ok');
						return res.status(200).json({msg_default_radius: "Modified!"});
					})
					.catch(() => {
						console.log('fail');
						return res.status(500).json({msg_default_radius: "Database error."});
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
					User.findOne({email: {$regex: new RegExp(`^${req.body.email}$`, 'i')}}).then(usr => {
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
			else if(req.body.website !== undefined){
				console.log(req.body.website);
				if(user.website === req.body.website){
					return res.status(200).json({msg_website: "Not modified!"});
				}
				else{
					user.website = req.body.website;
					user.save()
						.then(() => {
							return res.status(200).json({msg_website: "Modified!"});
						})
						.catch(() => {
							return res.status(500).json({msg_website: "Database error."});
						});
				}
			}
			else if(req.body.facebook !== undefined){
				if(user.facebook === req.body.facebook){
					return res.status(200).json({msg_facebook: "Not modified!"});
				}
				else{
					user.facebook = req.body.facebook;
					user.save()
						.then(() => {
							return res.status(200).json({msg_facebook: "Modified!"});
						})
						.catch(() => {
							return res.status(500).json({msg_facebook: "Database error."});
						});
				}
			}
			else if(req.body.twitter !== undefined){
				if(user.twitter === req.body.twitter){
					return res.status(200).json({msg_twitter: "Not modified!"});
				}
				else{
					user.twitter = req.body.twitter;
					user.save()
						.then(() => {
							return res.status(200).json({msg_twitter: "Modified!"});
						})
						.catch(() => {
							return res.status(500).json({msg_twitter: "Database error."});
						});
				}
			}
			else if(req.body.instagram !== undefined){
				if(user.instagram === req.body.instagram){
					return res.status(200).json({msg_instagram: "Not modified!"});
				}
				else{
					user.instagram = req.body.instagram;
					user.save()
						.then(() => {
							return res.status(200).json({msg_instagram: "Modified!"});
						})
						.catch(() => {
							return res.status(500).json({msg_instagram: "Database error."});
						});
				}
			}
			else if(req.body.zip_code !== undefined){
				user.zip_code = req.body.zip_code;
				user.location = req.body.location;
				user
					.save()
					.then(() => {
						// modified
						return res.status(200).json({msg_zip_code: "Modified!"});
					})
					.catch(() => {
						return res.status(500).json({msg_zip_code: "Database error."});
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

module.exports = router;
