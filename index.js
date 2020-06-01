const express = require("express");
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {MONGO_URL, FRONT_URL} = require("./config");
const passport = require("passport");
const users = require("./routes/users");
const communities = require("./routes/communities");
const stripepay = require("./routes/stripe-pay");
const testroute = require("./routes/test-route");
const config = require("./config");

app.use(
	cors({
		origin: config.FRONT_URL,
	})
);

// Body-parser middleware
app.use(
	bodyParser.json({
		limit: '50mb',
	}));

// Connect to MongoDB
mongoose
	.connect(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => console.log("MongoDB successfully connected"))
	.catch(err => console.log(err));

// Passport middleware
app.use(passport.initialize(null));

// Passport config
require("./utils/passport")(passport);

// Routes
app.use("/api/users", users);
app.use("/api/communities", communities);
app.use("/api/stripe", stripepay);
app.use("/api/test", testroute);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server up and running on port ${port}!`));
