import validators from "..";

export default (/** @type {string} pass */ pass) => {
	if (!pass) return false;
	if (pass.length < 8) return false;
	if (!validators.containsUpperCase(pass)) return false;
	if (!validators.containsLowerCase(pass)) return false;
	if (!validators.containsDigit(pass)) return false;
	if (!validators.containsSpecialChar(pass)) return false;
	return true;
};