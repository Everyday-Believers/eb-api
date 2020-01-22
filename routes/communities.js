const isEmpty = require("is-empty");

const express = require("express");
const router = express.Router();
const keys = require("../config");
// Load Community model
const Community = require("../models/Community");

// @route POST api/communities/create
// @desc Register community
// @access Public
router.post("/create", (req, res) => {
	const community_info = req.body.data;

	// console.log(community_info);

	// check the validation of (community_name, category, address)
	if(isEmpty(community_info.owner_email)){
		return res.status(400).json({
			msg_community: "Oops, is that community orphan?"
		});
	}
	else if(isEmpty(community_info.community_name) || isEmpty(community_info.category) || isEmpty(community_info.address)){
		return res.status(400).json({
			msg_community: `Community name, category, and address cannot be empty.
                     Please back to community base info.`
		});
	}
	else{
		// check existence for voiding of duplication.
		Community.findOne({
			community_name: community_info.community_name,
			category: community_info.category,
			address: community_info.address,
		}).then(community => {
			if(community){ // if it already exists and new, cannot create it.
				if(req.body.is_new){ // cannot create
					return res.status(400).json({msg_community: "The community already exists."});
				}
				else{ // edit it.
					community.updateOne(community_info)
						.then(() => {
							return res.status(200).json({msg_community: "The community was saved."});
						})
						.catch(err => console.log(err));
				}
			}
			else{ // we can create it.
				const newCommunity = new Community({
					...community_info,
				});
				newCommunity
					.save()
					.then(() => {
						return res.status(200).json({msg_community: "The community was created."});
					})
					.catch(err => console.log(err));
			}
		});
	}
});

// @route POST api/communities/find
// @desc Find community and return JWT token
// @access Public
router.post("/find", (req, res) => {
	const category = req.body.category;
	const radius = req.body.radius;
	const day = req.body.day;
	const time = req.body.time;
	const frequency = req.body.frequency;
	const age = req.body.age;
	const gender = req.body.gender;
	const parking = req.body.parking;
	const ministries = req.body.ministries;
	const otherServices = req.body.otherServices;
	const averageAttendance_min = req.body.averageAttendance_min;
	const averageAttendance_max = req.body.averageAttendance_max;
	const ambiance = req.body.ambiance;
	const eventType = req.body.eventType;
	const supportGroupType = req.body.supportGroupType;

	// Find user by email
	User.findOne({email: email}).then(user => {
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

/**
 * get my communities
 */
router.post("/mine", (req, res) => {
	Community.find({...req.body}).then(mines => {
		return res.status(200).json({activated: req.body.activated, results: [...mines]});
	});
});

/**
 * activate the community
 */
router.post("/activate", (req, res) => {
	Community.findOne({_id: req.body.community_id}).then(community => {
		if(community){
			community.updateOne({activated: true})
				.then(() => {
					return res.status(200).json({msg_community: "The community was activated."});
				})
				.catch(err => res.status(400).json({msg_community: err.toString()}));
		}
		else{
			return res.status(400).json({msg_community: "The community could not be activated."});
		}
	});
});

/**
 * deactivate the community
 */
router.post("/deactivate", (req, res) => {
	Community.findOne({_id: req.body.community_id}).then(community => {
		if(community){
			community.updateOne({activated: false})
				.then(() => {
					return res.status(200).json({msg_community: "The community was deactivated."});
				})
				.catch(err => res.status(400).json({msg_community: err.toString()}));
		}
		else{
			return res.status(400).json({msg_community: "The community could not be deactivated."});
		}
	});
});

/**
 * delete the community
 */
router.post("/delete", (req, res) => {
	Community.findOne({_id: req.body.community_id}).then(community => {
		if(community){
			community.remove({activated: true})
				.then(() => {
					return res.status(200).json({msg_community: "A community was deleted."});
				})
				.catch(err => res.status(400).json({msg_community: err.toString()}));
		}
		else{
			return res.status(400).json({msg_community: "The community could not be deleted."});
		}
	});
});

module.exports = router;
