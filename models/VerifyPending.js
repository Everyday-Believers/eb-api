const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * DB schema - request pending for email-verification
 */
const VerifyPendingSchema = new Schema({
	/**
	 * guessing-free key for arbitrary URL
	 */
	key: {
		type: String,
		required: true
	},

	/**
	 * email to verify.
	 */
	email: {
		type: String,
		required: true
	},

	/**
	 * pended date for calculation of expiry.
	 */
	pended_at: {
		type: Date,
		default: Date.now
	},
});

module.exports = VerifyPending = mongoose.model("verifypendings", VerifyPendingSchema);
