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
	pic: {
		type: String,
		default: "",
	},
	admin_email: { // just for displaying on admin panel.
		type: String,
		required: false,
	},
	phone: {
		type: String,
		required: false,
	},
	is_organization: {
		type: Boolean,
		default: false,
	},
	organization_name: {
		type: String,
		required: false,
	},
	website: {
		type: String,
		default: '',
	},
	facebook: {
		type: String,
		default: '',
	},
	twitter: {
		type: String,
		default: '',
	},
	instagram: {
		type: String,
		default: '',
	},
	zip_code: {
		type: String,
		required: false,
	},
	location: {
		type: Object,
		required: false,
	},
	default_category: {
		type: String,
		default: '',
	},
	default_radius: {
		type: Number,
		default: null,
	},
	colors: {
		type: Object,
		default: null,
	},
	email: { // for login. in user info
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
	password: {
		type: String,
		required: false,
	},
	ref_code: {
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
