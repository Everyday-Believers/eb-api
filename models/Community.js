const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * Community schema
 */
const CommunitySchema = new Schema({
	owner_id: {
		type: String,
		required: true,
	},
	activated: {
		type: Boolean,
		default: false,
	},
	activated_at: {
		type: Date,
		default: Date.now,
	},
	community_name: {
		type: String,
		required: true
	},
	category: {
		type: String,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	coordinate: {
		type: Object,
		required: false,
	},
	pictures: {
		type: Object,
		required: false
	},
	community_contact: {
		type: String,
		required: false
	},
	phone: {
		type: String,
		required: false
	},
	email: {
		type: String,
		required: false
	},
	website: {
		type: String,
		required: false
	},
	facebook: {
		type: String,
		required: false
	},
	instagram: {
		type: String,
		required: false
	},
	vimeo: {
		type: String,
		required: false
	},
	youtube: {
		type: String,
		required: false
	},
	twitter: {
		type: String,
		required: false
	},
	podcast: {
		type: String,
		required: false
	},
	zoom: {
		type: String,
		required: false
	},
	about: {
		type: String,
		required: false
	},

	// filters in binary sequence format
	days: {
		type: String,
		required: true
	},
	times: {
		type: String,
		required: true
	},
	frequency: {
		type: String,
		required: true
	},
	hosting: {
		type: String,
		required: true
	},
	ages: {
		type: String,
		required: true
	},
	gender: {
		type: String,
		required: true
	},
	kids_welcome: {
		type: String,
		required: true
	},
	parking: {
		type: String,
		required: true
	},
	ministries: {
		type: String,
		required: true
	},
	other_services: {
		type: String,
		required: true
	},
	average_attendance: {
		type: Number,
		required: true
	},
	ambiance: {
		type: String,
		required: true
	},
	event_type: {
		type: String,
		required: true
	},
	support_type: {
		type: String,
		required: true
	},
});

module.exports = Community = mongoose.model("community", CommunitySchema);
