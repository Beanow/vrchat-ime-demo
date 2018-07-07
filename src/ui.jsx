const {h} = require('preact');
const {replaceEmojiJokes} = require('./jokes');

const Mode = ({mode}) => <span id="mode">{mode}</span>
const FormPointer = ({mode}) => <div id="pointer"><Mode mode={mode} />&gt;</div>;
const InputTrap = ({onKeyPress, onKeyDown}) => <input type="text" autoFocus id="inputTrap" {...{onKeyPress, onKeyDown}} />
const Buffer = ({buffer, useJokes}) => <span id="buffer"><span id="bufferClip">{replaceEmojiJokes(buffer, useJokes)}</span></span>
const Output = ({output, useJokes}) => <span id="output"><span id="outputClip">{replaceEmojiJokes(output, useJokes)}</span></span>

const Logs = ({log, useJokes}) => (
	<div id="logs">
		{log.map(line => <div>{replaceEmojiJokes(line, useJokes)}</div>)}
	</div>
);

const Suggestion = (suggestion, isActive, useJokes) => <div className={isActive ? 'active' : ''}>{replaceEmojiJokes(suggestion, useJokes)}</div>

const innerSuggestions = (suggest, active, useJokes) => {
	if(suggest && suggest.length){
		return <div id="suggestions">{suggest.map((s, i) => Suggestion(s, i === active, useJokes))}</div>
	}
};

const Suggestions = ({suggest, active, useJokes}) => (
	<span id="suggestionAnchor">{innerSuggestions(suggest, active, useJokes)}</span>
);

const FormInput = ({output, suggest, active, buffer, onKeyPress, onKeyDown, useJokes}) => (
	<div id="input">
		<Output {...{output, useJokes}} />
		<Suggestions {...{suggest, active, useJokes}} />
		<Buffer {...{buffer, useJokes}} />
		<InputTrap {...{onKeyPress, onKeyDown}} />
	</div>
);

const Form = (props) => (
	<div id="form">
		<FormPointer mode={props.mode} />
		<FormInput {...props} />
	</div>
);

exports.App = props => (
	<div id="app">
		<Logs {...props} />
		<Form {...props} />
	</div>
);
