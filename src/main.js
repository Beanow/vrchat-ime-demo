// Polyfills for the VRChat browser.
require('whatwg-fetch');
require('url-search-params-polyfill');

// Our direct requirements.
const $ = require('jquery');
const wanakana = require('wanakana');
const {makeKeyFn} = require('./vrIME');

const bindIME = options => {
	const modeEl = $(options.mode);
	const outputEl = $(options.output);
	const bufferEl = $(options.buffer);
	const trapEl = $(options.trap);
	const logEl = $(options.log);
	const suggestionEl = $(options.suggestion);
	const toHiragana = input => wanakana.toHiragana(input, {IMEMode: true});

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
		trapEl.val('').focus();
	};

	const {keyFn, initialState, modeFn} = makeKeyFn(toHiragana, render);

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

	window.key = keyFn;
	window.mode = modeFn;
	window.text = function(str){
		for(var i = 0; i < str.length; i++){
			window.key(str[i]);
		}
	};
};

// Start with debug details.
document.getElementById('logs').innerHTML =
    'Failed to initialize scripts.<br>' +
    'TIME = ' + (new Date()).toISOString() + '<br>' +
    'fetch = ' + (window.fetch&&'Y'||'N') + '<br>' +
    'URLSearchParams = ' + (window.URLSearchParams&&'Y'||'N') + '<br>' +
    'Promise = ' + (window.Promise&&'Y'||'N') + '<br>' +
    navigator.userAgent;

// Attemp a binding.
try {
	bindIME({
		log: '#logs',
		mode: '#mode',
		output: '#output',
		buffer: '#buffer',
		trap: '#inputTrap',
		suggestion: '#suggestionAnchor'
	});
} catch(e) {
	document.getElementById('logs').innerHTML = 'Error binding IME ' + e.toString();
}
