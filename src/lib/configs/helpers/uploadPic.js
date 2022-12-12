import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
// getDownloadURL

const firebaseConfig = {
	apiKey: 'AIzaSyAeF6ZO2XXD9s4PzQ0W_4WIhMThIQwrGaw',
	authDomain: 'axion-users-profile-pics.firebaseapp.com',
	projectId: 'axion-users-profile-pics',
	storageBucket: 'axion-users-profile-pics.appspot.com',
	messagingSenderId: '303770037963',
	appId: '1:303770037963:web:fdffed778045e85934f54e',
	measurementId: 'G-BTH7DRZ762'
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * @param {string} userName
 * @param {string} file
 * @param {string} fileName
 * @param {import("@firebase/storage").UploadMetadata} meta
 */
export default (
	userName,
	file,
	fileName,
	meta
) => {
	const userRef = ref(storage, `${userName}/${fileName}`);
	const ups = uploadString(userRef, file, 'data_url', meta);

  return ups
	// ups.then((snapshot) => {
	// 	getDownloadURL(userRef).then(async (url) => {
	// 		// do here
	// 	});
	// });
};