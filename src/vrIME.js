const MAX_SUGGEST = 5;
const GET_MODE = /^#([a-z]+)\|/i;

const inputtoolsDefaults = {
	itc: 'ja-t-ja-hira-i0-und'
};

const fetchSuggestions = exports.fetchSuggestions = (buffer, num, itc) => {
	const params = new URLSearchParams();
	params.set('text', buffer);
	params.set('itc', itc || inputtoolsDefaults.itc);
	params.set('num', num || MAX_SUGGEST);
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
	loading: false
});

const suggestionsLoading = state => ({
	...state,
	loading: true,
	active: 0
});

const setActive = (state, active) => ({
	...state,
	active
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
		return setActive(state, ++state.active % state.suggest.length);
	}

	if(state.loading) {
		return setActive(state, ++state.active % MAX_SUGGEST);
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

	return suggestionsLoading(state);
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

const makeState = mode => ({
	mode: mode || 'EN',
	output: '',
	buffer: '',
	typing: '',
	loading: false,
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
	const hashContent = window.location.hash.match(GET_MODE);
	const initialMode = hashContent && hashContent[1] || null;
	let state = makeState(initialMode);
	const MODES = {
		JP: keyJP(toHiragana),
		EN: keyEN
	};

	const cb = (_, s) => {
		state = s;
		onStateChange({...s});
	};

	const keyFn = key => {
		state = captureMode(MODES, state, key, cb);
		window.location.hash = `#${state.mode}|${Math.random()}`;
		onStateChange({...state});
	};

	const modeFn = mode => {
		if(state.mode !== mode){
			state = clearBuffer(setMode(state, mode));
			window.location.hash = `#${state.mode}|${Math.random()}`;
			onStateChange({...state});
		}
	};

	return {
		keyFn,
		initialState: {...state},
		modeFn
	};
};
