const express = require("express");
const router = express.Router();
const keys = require("../../config/config");
// Load Community model
const Community = require("../../models/Community");

// @route POST api/communities/create
// @desc Register community
// @access Public
router.post("/create", (req, res) => {
    Community.findOne({email: req.body.email}).then(community => {
        if (community) {
            return res.status(400).json({email: "Email already exists"});
        } else {
            const newCommunity = new Community({
                category: req.body.category,
                name: req.body.name,
                address: req.body.address,
                imageURL: req.body.imageURL,
                communityContact: req.body.communityContact,
                phone: req.body.phone,
                email: req.body.email,
                facebookLink: req.body.facebookLink,
                instagramLink: req.body.instagramLink,
                vimeoLink: req.body.vimeoLink,
                youtubeLink: req.body.youtubeLink,
                description: req.body.description,
                day: req.body.day,
                time: req.body.time,
                frequency: req.body.frequency,
                age: req.body.age,
                gender: req.body.gender,
                parking: req.body.parking,
                ministries: req.body.ministries,
                otherServices: req.body.otherServices,
                averageAttendance: req.body.averageAttendance,
                ambiance: req.body.ambiance,
                eventType: req.body.eventType,
                supportGroupType: req.body.supportGroupType,
            });
            newCommunity
                .save()
                .then(community => res.json(community))
                .catch(err => console.log(err));
        }
    });
});

// @route POST api/communities/find
// @desc Find community and return JWT token
// @access Public
router.post("/find", (req, res) => {
    const category = req.body.category;
    const radius = req.body.radius;
    const day = req.body.day;
    const time = req.body.time;
    const frequency = req.body.frequency;
    const age = req.body.age;
    const gender = req.body.gender;
    const parking = req.body.parking;
    const ministries = req.body.ministries;
    const otherServices = req.body.otherServices;
    const averageAttendance_min = req.body.averageAttendance_min;
    const averageAttendance_max = req.body.averageAttendance_max;
    const ambiance = req.body.ambiance;
    const eventType = req.body.eventType;
    const supportGroupType = req.body.supportGroupType;

    // Find user by email
    User.findOne({email}).then(user => {
        // Check if user exists
        if (!user) {
            return res.status(404).json({emailnotfound: "Email not found"});
        }
        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                // User matched
                // Create JWT Payload
                const payload = {
                    id: user.id,
                    fname: user.fname,
                    lname: user.lname
                };
                // Sign token
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: 31556926 // 1 year in seconds
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            token: "Bearer " + token
                        });
                    }
                );
            } else {
                return res
                    .status(400)
                    .json({passwordincorrect: "Password incorrect"});
            }
        });
    });
});

module.exports = router;
