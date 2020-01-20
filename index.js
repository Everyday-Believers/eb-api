const express = require("express");
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {MONGO_URL} = require("./config");
const passport = require("passport");
const users = require("./routes/users");
const communities = require("./routes/communities");

app.use(cors());

// Body-parser middleware
app.use(
	bodyParser.urlencoded({
		extended: false
	})
);

app.use(bodyParser.json());

// Connect to MongoDB
mongoose
	.connect(MONGO_URL, {useNewUrlParser: true})
	.then(() => console.log("MongoDB successfully connected"))
	.catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize(null));

// Passport config
require("./utils/passport")(passport);

// Routes
app.use("/api/users", users);
app.use("/api/communities", communities);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server up and running on port ${port} !`));
