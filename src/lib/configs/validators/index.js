import constants from '$lib/configs/constants/index'

export default {
	isEmailValid: (/** @type string */ email) => {
		const emailRegexp = new RegExp(
			/^[a-zA-Z0-9][\~\!\$\%\^\&\*_\=\+\}\{\'\?\-\.\\\#\/\`\|]{0,1}([a-zA-Z0-9][\~\!\$\%\^\&\*_\=\+\}\{\'\?\-\.\\\#\/\`\|]{0,1})*[a-zA-Z0-9]@[a-zA-Z0-9][-\.]{0,1}([a-zA-Z][-\.]{0,1})*[a-zA-Z0-9]\.[a-zA-Z0-9]{1,}([\.\-]{0,1}[a-zA-Z]){0,}[a-zA-Z0-9]{0,}$/i
		);
		return emailRegexp.test(email);
	},
	containsUpperCase: (/** @type string */ text) => {
		let upChecker = false;
		constants.upperCasedLetters.every((c) => {
			if (text.match(c)) {
				upChecker = true;
				return false;
			}
			return true;
		});
		return upChecker;
	},
	containsLowerCase: (/** @type string */ text) => {
		let lowerChecker = false;
		constants.lowerCasedLetters.every((c) => {
			if (text.match(c)) {
				lowerChecker = true;
				return false;
			}
			return true;
		});
		return lowerChecker;
	},
	containsDigit: (/** @type string */ text) => {
		let numChecker = false;
		constants.digits.every((d) => {
			if (text.match(d.toString())) {
				numChecker = true;
				return false;
			}
			return true;
		});
		return numChecker;
	},
	containsSpecialChar: (/** @type string */ text) => {
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
	}
};
