const {suggestApplyJokes} = require('./jokes');

const MIN_SUGGEST = 3;
const MAX_SUGGEST = 15;

const inputtoolsITC = {
	JP: 'ja-t-ja-hira-i0-und'
};

const inputtoolsDefaults = {
	num: 7
};

const between = (min, max) => val => Math.min(max, Math.max(min, val));
const numSuggest = between(MIN_SUGGEST, MAX_SUGGEST);

const fetchSuggestions = ({joker, itc}) => (buffer, num) => {
	const actualNum = numSuggest(num || inputtoolsDefaults.num);
	const params = new URLSearchParams();
	params.set('text', buffer);
	params.set('itc', itc);
	params.set('num', actualNum);
	// Google sets these values in its own AJAX calls, but they're
	// cryptic and undocumented, so I'm passing them along.
	params.set('cp', 0);
	params.set('cs', 1);
	// Input and output encoding
	params.set('ie', 'utf-8');
	params.set('oe', 'utf-8');
	// Doesn't seem to matter what this is.
	params.set('app', 'test');

	return fetch(`https://inputtools.google.com/request?${params.toString()}`)
	.then(response => response.json())
	.catch(error => Promise.reject(`Error fetching suggestions: ${error}`))
	.then(result => {
		if(!result[1] || !result[1][0] || !result[1][0][1]) {
			return Promise.reject(`Result had unexpected format: ${result}`);
		}

		return result[1][0][1];
	})
	.then(joker(actualNum, buffer));
};

exports.googleInputTools = jokes => {
	const joker = suggestApplyJokes(jokes);
	return {
		JP: fetchSuggestions({joker, itc: inputtoolsITC.JP})
	};
};
