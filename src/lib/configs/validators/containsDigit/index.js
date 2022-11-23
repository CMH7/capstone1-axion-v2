import constants from "$lib/configs/constants";

export default (/** @type string */ text) => {
	let numChecker = false;
	constants.digits.every((d) => {
		if (text.match(d.toString())) {
			numChecker = true;
			return false;
		}
		return true;
	});
	return numChecker;
};