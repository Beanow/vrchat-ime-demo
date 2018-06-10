require('whatwg-fetch');
require('url-search-params-polyfill');

const inputtoolsDefaults = {
	itc: 'ja-t-ja-hira-i0-und',
	num: 5
};

const fetchSuggestions = exports.fetchSuggestions = (buffer, num, itc) => {
	const params = new URLSearchParams();
	params.set('text', buffer);
	params.set('itc', itc || inputtoolsDefaults.itc);
	params.set('num', num || inputtoolsDefaults.num);
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
	});
};

const clearSuggestions = state => ({
	...state,
	suggest: [],
	active: 0
});

const clearBuffer = state => clearSuggestions({
	...state,
	buffer: ''
});

const clearAll = state => clearBuffer({
	...state,
	output: ''
});

const logOutput = state => clearAll({
	...state,
	log: state.output.length > 0 ? [...state.log, state.output] : state.log
});

const logError = (state, error) => ({
	...state,
	log: [...state.log, `ERROR: error`]
});

const setSuggestions = (state, suggest) => ({
	...state,
	suggest,
	active: 0
});

const incrementActive = state => ({
	...state,
	active: ++state.active % state.suggest.length
});

const popLetter = state =>
	state.buffer.length > 0 ? {...state, buffer: state.buffer.slice(0, -1)} :
	state.output.length > 0 ? {...state, output: state.output.slice(0, -1)} :
	state;

const removeLine = state =>
	state.log.length === 0 ? state :
	{...state, log: state.log.slice(0, -1)};

const commitSuggestion = state =>
	state.buffer.length === 0 ? logOutput(state) :
	clearBuffer({
		...state,
		output: state.output + (state.suggest.length > 0 ? state.suggest[state.active] : state.buffer)
	});

const pushBuffer = (toHiragana, state, char, opts) => ({
	...state,
	buffer: toHiragana(state.buffer + char)
});

const pushOutput = (state, char) => ({
	...state,
	output: state.output + char
});

const cycleSuggestions = (state, cb) => {
	if(state.buffer.length === 0) {
		return state;
	}

	if(state.suggest.length > 0) {
		return incrementActive(state);
	}

	try {
		fetchSuggestions(state.buffer)
		.then(
			s => {
				cb(null, setSuggestions(state, s));
			},
			err => {
				cb(null, logError(state, err));
			}
		);
	} catch (e) {
		return logError(state, e.message);
	}

	return state;
};

const setMode = (state, mode) => ({
	...state,
	mode
});

const KEYS_JP = {
	RM: removeLine,
	BS: state => popLetter(clearSuggestions(state)),
	ENT: commitSuggestion,
	' ': cycleSuggestions
};

const KEYS_EN = {
	BS: popLetter,
	RM: removeLine,
	ENT: logOutput
};

const keyJP = toHiragana => (state, key, cb) => {
	if(KEYS_JP[key]) {
		return KEYS_JP[key](state, cb);
	}
	return pushBuffer(toHiragana, clearSuggestions(state), key);
};

const keyEN = (state, key, _) => {
	if(KEYS_EN[key]) {
		return KEYS_EN[key](state, () => {});
	}
	return pushOutput(state, key);
};

const makeState = () => ({
	mode: 'EN',
	output: '',
	buffer: '',
	typing: '',
	suggest: [],
	active: 0,
	log: []
});

const captureMode = (modes, state, key, cb) => {
	if(key === 'MODE') {
		return clearBuffer(setMode(
			state,
			state.mode === 'EN' ? 'JP' : 'EN'
		));
	}

	return modes[state.mode](state, key, cb);
};

const makeKeyFn = exports.makeKeyFn = (toHiragana, onStateChange) => {
	let state = makeState();
	const MODES = {
		JP: keyJP(toHiragana),
		EN: keyEN
	};

	const cb = (_, s) => {
		state = s;
		onStateChange({...s});
	};

	const keyFn = key => {
		window.location.hash = '#' + Math.random();
		state = captureMode(MODES, state, key, cb);
		onStateChange({...state});
	};

	return {
		keyFn,
		initialState: {...state}
	};
};

exports.bindIME = options => {
	const $ = options.jQuery;
	const modeEl = $(options.mode);
	const outputEl = $(options.output);
	const bufferEl = $(options.buffer);
	const trapEl = $(options.trap);
	const logEl = $(options.log);
	const suggestionEl = $(options.suggestion);
	const toHiragana = options.toHiragana || wanakana.toHiragana;

	const render = state => {
		let out = '';
		for(let i in state.suggest) {
			out += state.suggest[i];
			if(i == state.active) {
				out += '*';
			}
			out += '<br>';
		}
		suggestionEl.html(out.length ? `<div id="suggestions">${out}</div>` : '');
		bufferEl.html(state.suggest.length ? state.suggest[state.active] : state.buffer);
		outputEl.html(state.output);
		modeEl.html(state.mode);
		logEl.html(`<div>${state.log.join('</div><div>')}</div>`);
		trapEl.val('');
	};

	const {keyFn, initialState} = makeKeyFn(toHiragana, render);

	trapEl.bind('keypress', e => {
		const charCode = String.fromCharCode(e.charCode);

		// Use [`] for mode switch.
		if (charCode === '`') {
			e.preventDefault();
			keyFn('MODE');
			return;
		}

		// Letters get pushed.
		if (charCode != '') {
			e.preventDefault();
			keyFn(charCode);
		}
	});

	trapEl.bind("keydown", function(e) {
		// Hit [Enter] for suggestion acceptance.
		if (e.which === 13) {
			e.preventDefault();
			keyFn('ENT');
		}

		// On backspace, drop the last char.
		if (e.which === 8) {
			e.preventDefault();
			keyFn('BS');
		}

		// On delete, drop the last log line.
		if (e.which === 46) {
			e.preventDefault();
			keyFn('RM');
		}

		// Use [TAB] for mode switch.
		if (e.which === 9) {
			e.preventDefault();
			keyFn('MODE');
		}
	});

	render(initialState);

	return keyFn;
};
