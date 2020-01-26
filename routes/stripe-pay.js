const express = require("express");
const router = express.Router();
const config = require("../config");
const User = require("../models/User");
const stripe = require('stripe')(config.STRIPE_SK);

/**
 * create customer
 *
 * req.body.
 */
router.post("/createcustomer", async (req, res) => {
	const holder_email = req.body.email;

	const customer = await stripe.customers.create({...req.body});

	console.log(customer);

	User.findOne({email: holder_email}).then(user => {
		if(user){
			user.billing_info = customer;
			user
				.save()
				.then(() => {
					// Ok, created user was saved in database.
					return res.status(200).json({billing: "The email address is not exist."});
				})
				.catch(err => res.status(500).json({error: `Error: '${err}'.`}));
		}
		else{
			return res.status(500).json({billing: "The email address is not exist."});
		}
	});
});

/**
 * received the request to create a subscription from client.
 */
router.post("/createsub", async (req, res) => {
	const subscription = await stripe.subscriptions.create({
		customer: 'cus_5111231234',

	});
});

/**
 * received the request to update a subscription from client.
 */
router.post("/updatesub", (req, res) => {

});

module.exports = router;
