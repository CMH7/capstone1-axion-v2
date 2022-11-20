import constants from '$lib/configs/constants/index';

export default (/** @type string */ text) => {
	let upChecker = false;
	constants.upperCasedLetters.every((c) => {
		if (text.match(c)) {
			upChecker = true;
			return false;
		}
		return true;
	});
	return upChecker;
};
