const MAX_MESSAGE_SIZE = 60;

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
	log: [...state.log, `ERROR: ${error}`]
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

const commitSuggestionWhenSelected = state =>
	state.suggest.length > 0 ?
	clearBuffer({...state, output: state.output + state.suggest[state.active]}) :
	state

const pushBuffer = (toHiragana, state, char, opts) => ({
	...state,
	buffer: state.output.length + state.buffer.length < MAX_MESSAGE_SIZE ? toHiragana(state.buffer + char) : state.buffer
});

const pushOutput = (state, char) => ({
	...state,
	output: state.output.length < MAX_MESSAGE_SIZE ? state.output + char : state.output
});

const cycleSuggestions = (state, cb, fetchSuggestions) => {
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

const keyJP = (toHiragana, fetchSuggestions) => (state, key, cb) => {
	if(KEYS_JP[key.toUpperCase()]) {
		return KEYS_JP[key.toUpperCase()](state, cb, fetchSuggestions);
	}
	return pushBuffer(toHiragana, commitSuggestionWhenSelected(state), key);
};

const keyEN = (state, key, _) => {
	if(KEYS_EN[key.toUpperCase()]) {
		return KEYS_EN[key.toUpperCase()](state, () => {});
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

exports.makeReducers = (toHiragana, onStateChange, suggest, initialMode) => {
	let state = makeState(initialMode);

	const MODES = {
		JP: keyJP(toHiragana, suggest.JP),
		EN: keyEN
	};

	const cb = (_, s) => {
		state = s;
		onStateChange({...s});
	};

	const keyFn = key => {
		state = captureMode(MODES, state, key, cb);
		onStateChange({...state});
	};

	const modeFn = mode => {
		if(state.mode !== mode){
			state = clearBuffer(setMode(state, mode));
			onStateChange({...state});
		}
	};

	return {
		initialState: {...state},
		keyFn,
		modeFn
	};
};
