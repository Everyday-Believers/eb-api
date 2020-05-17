const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * DB schema - request pending for forgot-password
 */
const ResetPendingSchema = new Schema({
	/**
	 * guessing-free key for arbitrary URL
	 */
	key: {
		type: String,
		required: true
	},

	/**
	 * email of user who request to reset password.
	 */
	email: {
		type: String,
		required: true
	},

	/**
	 * pending date for calculation of expiry.
	 */
	pended_at: {
		type: Date,
		default: Date.now
	},
});

module.exports = ResetPending = mongoose.model("resetpendings", ResetPendingSchema);
