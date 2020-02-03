const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateRegisterInput(data){
	let msg = '';

    // Convert empty fields to an empty string so we can use validator functions
	data.fname = !isEmpty(data.fname) ? data.fname : "";
	data.lname = !isEmpty(data.lname) ? data.lname : "";
	data.email = !isEmpty(data.email) ? data.email : "";
	data.password = !isEmpty(data.password) ? data.password : "";
	data.password2 = !isEmpty(data.password2) ? data.password2 : "";

    // Name checks
	if(Validator.isEmpty(data.fname)){
		msg = "First name field is required";
	}
	if(Validator.isEmpty(data.lname)){
		msg = "Last name field is required";
	}

	// Email checks
	if(Validator.isEmpty(data.email)){
		msg = "Email field is required";
	}
	else if(!Validator.isEmail(data.email)){
		msg = "Email is invalid";
	}

    // Password checks
	if(Validator.isEmpty(data.password)){
		msg = "Password field is required";
	}
	if(Validator.isEmpty(data.password2)){
		msg = "Confirm password field is required";
	}
	if(!Validator.isLength(data.password, {min: 6, max: 30})){
		msg = "Password must be at least 6 characters";
	}
	if(!Validator.equals(data.password, data.password2)){
		msg = "Passwords must match";
	}

	return {
		msg: msg,
		isValid: isEmpty(msg),
	};
};
