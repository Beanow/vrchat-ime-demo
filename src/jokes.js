const {h} = require('preact');

const KUSOU_KANA = 'くそう';
const KUSOU_KANJI = '😨';
const KUSOU_FINDER = /(臭う|くそう)/i;

const KUSOU_EL = h('img', {className: 'kusou', src: 'img/kusou-gamma.png'});

const interleave = (input, value) => {
	let output = [input[0]];
	for(let i = 1; i < input.length; i++){
		output.push(value);
		output.push(input[i]);
	}
	return output;
};

const kusouJoke = (num, input, initialResults) => {
	let results = initialResults;
	if(input.indexOf(KUSOU_KANA) !== -1){
		results = [
			(results[0] || input).replace(KUSOU_FINDER, KUSOU_KANJI),
			...results
		];
		while(results.length > num) results.pop();
	}
	return results;
};

exports.suggestApplyJokes = jokes => (num, input) => initialResults => {
	let results = initialResults;
	if(jokes.kusou) results = kusouJoke(num, input, initialResults);
	return results;
};

exports.replaceEmojiJokes = (input, useJokes) => useJokes ? h('span', null, interleave(input.split(KUSOU_KANJI), KUSOU_EL)) : input;
