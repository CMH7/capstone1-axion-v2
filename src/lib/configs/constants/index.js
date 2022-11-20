import courses from "../collections/courses";
import schools from "../collections/schools";

export default {
	lowerCasedLetters: new String('abcdefghijklmnopqrstuvwxyz').split(''),
	upperCasedLetters: new String('ABCDEFGHIJKLMNOPQRSTUVWXYZ').split(''),
	digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  specialCharacters: "~!$%^&*_=+}{'?-".split(''),
  courses,
  schools
};