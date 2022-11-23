import preprocess from 'svelte-preprocess';
import node from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: node(),
		csrf: {
			checkOrigin: false
		}
	},

	preprocess: [
		preprocess({
			scss: {
				prependData: '@use "src/variables.scss" as *;'
			}
		})
	]
};

export default config;
