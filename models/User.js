const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * User Schema
 */
const UserSchema = new Schema({
	fname: {
		type: String,
		required: true,
	},
	lname: {
		type: String,
		required: true,
	},
	email: { // after verified, it is not able to be changed. or not?
		type: String,
		required: true,
	},
	email_verified: {
		type: Boolean,
		default: false,
	},
	email_verified_at: {
		type: Date,
		default: null,
	},
	phone: {
		type: String,
		required: false,
	},
	password: {
		type: String,
		required: false,
	},
	registered_at: {
		type: Date,
		default: Date.now,
	},
	google_id: {
		type: String,
		required: false,
	},
	facebook_id: {
		type: String,
		required: false,
	},
	ref_code: {
		type: String,
		required: false,
	},
	billing_card: {
		type: String,
		required: false,
	},
	billing_zip_code: {
		type: String,
		required: false,
	},
	billing_info: { // customer object, which includes the subscriptions and more created from stripe customer.create()
		type: Object,
		required: false,
	},
	tickets: {
		type: Number,
		required: false,
		default: 0,
	},
	ticket_expiry: {
		type: Date,
		required: false,
		default: null,
	},
});

module.exports = User = mongoose.model("users", UserSchema);
