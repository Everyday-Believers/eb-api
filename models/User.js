const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    registered_at: {
        type: Date,
        default: Date.now
    },
    google_id: {
        type: String,
        required: false,
    },
    facebook_id: {
        type: String,
        required: false,
    }
});

module.exports = User = mongoose.model("users", UserSchema);
