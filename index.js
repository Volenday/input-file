const core = require('@actions/core');
const github = require('@actions/github');

try {
	const name = core.getInput('whoToGreet');
	console.log('name: ', name);
} catch (error) {
	console.log('error: ', error);
}
