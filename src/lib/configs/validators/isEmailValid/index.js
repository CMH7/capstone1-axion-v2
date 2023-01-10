export default (/** @type string */ email) => {
	const emailRegexp = new RegExp(
		/^[a-zA-Z0-9][~!$%^&*_=+}{'?\-.\\#/`|]{0,1}([a-zA-Z0-9][~!$%^&*_=+}{'?\-.\\#/`|]{0,1})*[a-zA-Z0-9]@[a-zA-Z0-9][-.]{0,1}([a-zA-Z][-.]{0,1})*[a-zA-Z0-9]\.[a-zA-Z0-9]{1,}([.-]{0,1}[a-zA-Z]){0,}[a-zA-Z0-9]{0,}$/i
	);
	return emailRegexp.test(email);
};