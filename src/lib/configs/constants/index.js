import courses from "../collections/courses";
import schools from "../collections/schools";
import colors from "../collections/colors";

export default {
	lowerCasedLetters: new String('abcdefghijklmnopqrstuvwxyz').split(''),
	upperCasedLetters: new String('ABCDEFGHIJKLMNOPQRSTUVWXYZ').split(''),
	digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	specialCharacters: "~!$%^&*_=+}{'?-".split(''),
	courses,
	schools,
	colors,
  /**
   * 
   * @param {string} to 
   * @param {string} fullName 
   * @param {string} link 
   * @returns 
   */
	newMsg: (to, fullName, link) => {
		return {
			to,
			from: 'axionwebdev22@gmail.com',
			template_id: 'd-ea2d8bc359bb4b18ab371717cd69864b',
			dynamic_template_data: {
				fullName,
				link
			}
		};
  },
  /**
   * 
   * @param {string} to 
   * @param {string} fullName 
   * @param {string} link 
   * @returns 
   */
	resetMsg: (to, fullName, link) => {
		return {
			to,
			from: 'axionwebdev22@gmail.com',
			template_id: 'd-87c76215d73a40bb803a0900d8c51847',
			dynamic_template_data: {
				fullName,
				link
			}
		};
	},
  /**
   * 
   * @param {string} to 
   * @param {string} resetCode 
   * @returns 
   */
	resetPassMsg: (to, resetCode) => {
		return {
			to,
			from: 'axionwebdev22@gmail.com',
			template_id: 'd-121d0be0adfc45b7870be956ad89fc0d',
			dynamic_template_data: {
				resetCode,
			}
		};
	},
  /**
   * 
   * @param {string} to 
   * @param {string} resetCode 
   * @returns 
   */
	changeEmailMsg: (to, resetCode) => {
		return {
			to,
			from: 'axionwebdev22@gmail.com',
			template_id: 'd-c4c1d446d2d445658379e433c00ed3b8',
			dynamic_template_data: {
				resetCode
			}
		};
	},
  /**
   * 
   * @param {string} to 
   * @param {string} resetCode 
   * @returns 
   */
	deleteAccMsg: (to, resetCode) => {
		return {
			to,
			from: 'axionwebdev22@gmail.com',
			template_id: 'd-25c76f9a30e84341bf734cebd86a54b5',
			dynamic_template_data: {
				resetCode
			}
		};
	},
};