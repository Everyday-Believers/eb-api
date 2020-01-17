const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const CommunitySchema = new Schema({
    category: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    imageURL: {
        type: String,
        required: true
    },
    communityContact: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    facebookLink: {
        type: String,
        required: true
    },
    instagramLink: {
        type: String,
        required: true
    },
    vimeoLink: {
        type: String,
        required: true
    },
    youtubeLink: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },

    //binary stream
    day: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    gender: {
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
    otherServices: {
        type: String,
        required: true
    },
    averageAttendance: {
        type: Number,
        required: true
    },
    ambiance: {
        type: String,
        required: true
    },
    eventType: {
        type: String,
        required: true
    },
    supportGroupType: {
        type: String,
        required: true
    },
});
module.exports = Community = mongoose.model("community", CommunitySchema);
