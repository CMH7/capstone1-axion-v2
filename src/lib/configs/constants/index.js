import courses from "../collections/courses";
import schools from "../collections/schools";

export default {
	lowerCasedLetters: new String('abcdefghijklmnopqrstuvwxyz').split(''),
	upperCasedLetters: new String('ABCDEFGHIJKLMNOPQRSTUVWXYZ').split(''),
	digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	specialCharacters: "~!$%^&*_=+}{'?-".split(''),
	courses,
  schools,
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
	}
};