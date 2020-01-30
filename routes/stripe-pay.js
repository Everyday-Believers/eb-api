const express = require("express");
const router = express.Router();
const config = require("../config");
const User = require("../models/User");
const stripe = require('stripe')(config.STRIPE_SK);

/**
 * get stripe status
 */
router.post("/getstatus", async (req, res) => {
	const holder_email = req.body.email;

	User.findOne({email: holder_email}).then(async (user) => {
		if(user){
			if(user.billing_info){
				// get the subscriptions related to this customer.
				const my_subscriptions = await stripe.subscriptions.list({
					limit: 1,
					customer: user.billing_info.id,
					plan: config.SUBSCRIBER_MONTHLY_PLAN,
					status: "active",
				});

				const uc_invoice = await stripe.invoices.retrieveUpcoming({
					customer: user.billing_info.id,
				});

				return res.status(200).json({
					customer: user.billing_info,
					subscription: my_subscriptions.data[0].items.data[0],
					upcoming_invoice: uc_invoice,
				});
			}
			else{
				return res.status(200).json({
					customer: null,
					subscription: null,
					upcoming_invoice: null,
				});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({billing: "The email address is not exist."});
		}
	});
});

module.exports = router;
