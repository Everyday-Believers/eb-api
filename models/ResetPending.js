const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const ResetPendingSchema = new Schema({
	key: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true
	},
	pended_at: {
		type: Date,
		default: Date.now
	},
});

module.exports = ResetPending = mongoose.model("resetpendings", ResetPendingSchema);
