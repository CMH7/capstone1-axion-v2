import constants from "$lib/configs/constants";

export default (/** @type string */ text) => {
	let lowerChecker = false;
	constants.lowerCasedLetters.every((c) => {
		if (text.match(c)) {
			lowerChecker = true;
			return false;
		}
		return true;
	});
	return lowerChecker;
};
