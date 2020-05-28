const Validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateRegisterInput(data){
	let msg = {};

	// Convert empty fields to an empty string so we can use validator functions
	data.fname = !isEmpty(data.fname) ? data.fname : "";
	data.lname = !isEmpty(data.lname) ? data.lname : "";
	data.email = !isEmpty(data.email) ? data.email : "";
	data.password = !isEmpty(data.password) ? data.password : "";
	data.password2 = !isEmpty(data.password2) ? data.password2 : "";

	// Name checks
	if(Validator.isEmpty(data.fname)){
		msg.msg_reg_fname = "First name field is required";
	}
	if(Validator.isEmpty(data.lname)){
		msg.msg_reg_lname = "Last name field is required";
	}

	// Email checks
	if(Validator.isEmpty(data.email)){
		msg.msg_reg_email = "Email field is required";
	}
	else if(!Validator.isEmail(data.email)){
		msg.msg_reg_email = "Email is invalid";
	}

	// Password checks
	if(Validator.isEmpty(data.password)){
		msg.msg_reg_password = "Password field is required";
	}
	if(Validator.isEmpty(data.password2)){
		msg.msg_reg_password2 = "Confirm password field is required";
	}
	if(!Validator.isLength(data.password, {min: 6, max: 30})){
		msg.msg_reg_password = "Password must be at least 6 characters";
	}
	if(!Validator.equals(data.password, data.password2)){
		msg.msg_reg_password = "Passwords do not match. Please try again.";
	}

	// organization
	if(data.is_organization && Validator.isEmpty(data.organization_name)){
		msg.msg_reg_organization_name = "Organization name cannot be empty.";
	}

	return {
		msg: msg,
		isValid: isEmpty(msg),
	};
};
