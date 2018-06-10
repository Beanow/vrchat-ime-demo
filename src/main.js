// Polyfills for the VRChat browser.
require('whatwg-fetch');
require('url-search-params-polyfill');

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
	// Get our main program in here.
	const {bindIME} = require('./vrIME');
	window.key = bindIME({
		log: '#logs',
		mode: '#mode',
		output: '#output',
		buffer: '#buffer',
		trap: '#inputTrap',
		suggestion: '#suggestionAnchor'
	});
	window.text = function(str){
		for(var i = 0; i < str.length; i++){
			window.key(str[i]);
		}
	};
} catch(e) {
	document.getElementById('logs').innerHTML = 'Error binding IME ' + e.toString();
}
