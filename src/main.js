// Polyfills for the VRChat browser.
require('whatwg-fetch');
require('url-search-params-polyfill');

// Our direct requirements.
const wanakana = require('wanakana');
const {render} = require('preact');

// Our local scripts.
const {googleInputTools} = require('./suggest');
const {makeReducers} = require('./vrIME');
const {App} = require('./ui.jsx');

const GET_MODE = /^#([a-z]+)\|/i;
const GET_JOKES = /^\?jokes/i;
const toHiragana = input => wanakana.toHiragana(input, {IMEMode: true});

const onKeyPress = ({key}) => e => {
	const charCode = String.fromCharCode(e.charCode);

	// Letters get pushed.
	if (charCode != '') {
		e.preventDefault();
		key(charCode);
	}
};

const onKeyDown = ({key}) => e => {
	// Hit [Enter] for suggestion acceptance.
	if (e.which === 13) {
		e.preventDefault();
		key('ENT');
	}

	// On backspace, drop the last char.
	if (e.which === 8) {
		e.preventDefault();
		key('BS');
	}

	// On delete, drop the last log line.
	if (e.which === 46) {
		e.preventDefault();
		key('RM');
	}

	// Use [TAB] for mode switch.
	if (e.which === 9) {
		e.preventDefault();
		key('MODE');
	}
};

const bindIME = (initialMode, rootEl, jokes) => {
	// Since we have a circular depenceny, create a mutable object as a placeholder.
	const fn = {};
	const useJokes = Object.keys(jokes).length > 0;

	const onStateChange = state => {
		window.location.hash = `#${state.mode}|${Math.random()}`;
		render(App({
			...state,
			useJokes,
			onKeyPress: onKeyPress(fn),
			onKeyDown: onKeyDown(fn)
		}), document.body, rootEl);
	};

	// Start initializing the state processors.
	const {initialState, keyFn, modeFn} = makeReducers(toHiragana, onStateChange, googleInputTools(jokes), initialMode);
	window.key = fn.key = keyFn;
	window.mode = modeFn;
	window.text = function(str){
		for(var i = 0; i < str.length; i++){
			window.key(str[i]);
		}
	};
	
	onStateChange(initialState);
};

// Start with debug details.
document.getElementById('app').innerHTML =
    'Failed to initialize scripts.<br>' +
    'TIME = ' + (new Date()).toISOString() + '<br>' +
    'fetch = ' + (window.fetch&&'Y'||'N') + '<br>' +
    'URLSearchParams = ' + (window.URLSearchParams&&'Y'||'N') + '<br>' +
    'Promise = ' + (window.Promise&&'Y'||'N') + '<br>' +
    navigator.userAgent;

// Attemp a binding.
try {
	const hashContent = window.location.hash.match(GET_MODE);
	const initialMode = hashContent && hashContent[1] || null;
	const jokes = window.useJokes ? {kusou: true} : {};
	bindIME(initialMode, document.getElementById('app'), jokes);
} catch(e) {
	document.getElementById('app').innerHTML = 'Error binding IME ' + e.toString();
	throw e;
}
