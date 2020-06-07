const express = require("express");
const router = express.Router();
const config = require("../config");
const User = require("../models/User");
const stripe = require('stripe')(config.STRIPE_SK);

/**
 * get stripe status
 */
router.post("/getstatus", async (req, res) => {
	User.findOne({_id: req.body.user_id}).then(async (user) => {
		if(user){
			if(user.billing_info){
				// get the subscriptions related to this customer.
				let trialing = false;
				let my_subscriptions = await stripe.subscriptions.list({
					limit: 1,
					customer: user.billing_info.id,
					plan: config.SUBSCRIBER_MONTHLY_PLAN,
					status: "active",
				});

				if(my_subscriptions.data.length === 0){
					my_subscriptions = await stripe.subscriptions.list({
						limit: 1,
						customer: user.billing_info.id,
						plan: config.SUBSCRIBER_MONTHLY_PLAN,
						status: "trialing",
					});

					trialing = true;
				}

				if(my_subscriptions.data.length > 0){
					const uc_invoice = await stripe.invoices.retrieveUpcoming({
						customer: user.billing_info.id,
					}, function(err, invo){
						if(err){
							return res.status(200).json({
								tickets: user.tickets ? user.tickets : 0,
								subscription: my_subscriptions.data.length > 0 ? my_subscriptions.data[0] : null,
								upcoming_invoice: null,
								trialing: trialing,
							});
						}
						else{
							return res.status(200).json({
								tickets: user.tickets ? user.tickets : 0,
								subscription: my_subscriptions.data.length > 0 ? my_subscriptions.data[0] : null,
								upcoming_invoice: invo,
								trialing: trialing,
							});
						}
					});
				}
			}
			else{
				return res.status(200).json({
					tickets: 0,
					subscription: null,
					upcoming_invoice: null,
				});
			}
		}
		else{
			/**
			 * We would not be arriving here, newer! Because we use an appropriate auth email.
			 */
			return res.status(500).json({billing: "The user not found."});
		}
	});
});

router.post("/getplan", async (req, res) => {
	await stripe.plans.retrieve(
		config.SUBSCRIBER_MONTHLY_PLAN,
		function(err, plan){
			if(err){
				return res.status(200).json({amount: 0, trial_period_days: 0});
			}
			else{
				return res.status(200).json({amount: plan.amount, trial_period_days: plan.trial_period_days});
			}
		});
});

router.post("/verifycoupon", async (req, res) => {
	await stripe.coupons.retrieve(
		req.body.code, // coupon id
		function(err, coupon){
			if(err){
				return res.status(400).json({verified: false, message: err.toString()});
			}
			else{
				return res.status(200).json({verified: coupon.valid, name: coupon.name, amount_off: coupon.amount_off, percent_off: coupon.percent_off});
			}
		});
});

module.exports = router;
