import constants from "$lib/configs/constants";

export default (/** @type string */ text) => {
	let specChecker;
	constants.specialCharacters.every((sc) => {
		const re = new RegExp(`\\${sc}`);
		if (text.match(re)) {
			specChecker = true;
			return false;
		}
		return true;
	});
	return specChecker;
};