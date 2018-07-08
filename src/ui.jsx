const {h} = require('preact');
const {replaceEmojiJokes} = require('./jokes');

const Mode = ({mode}) => <span id="mode">{mode}</span>
const FormPointer = ({mode}) => <div id="pointer"><Mode mode={mode} />&gt;</div>;
const InputTrap = ({onKeyPress, onKeyDown}) => <input type="text" autoFocus id="inputTrap" {...{onKeyPress, onKeyDown}} />
const Buffer = ({buffer, useJokes}) => <span id="buffer"><span id="bufferClip">{replaceEmojiJokes(buffer, useJokes)}</span></span>
const Output = ({output, useJokes}) => <span id="output"><span id="outputClip">{replaceEmojiJokes(output, useJokes)}</span></span>

const Logs = ({log, useJokes}) => (
	<div id="logs">
		{log.map((line, i) => <div key={i} className={i === log.length-1 ? 'current' : ''}>{replaceEmojiJokes(line, useJokes)}</div>)}
		<div key={log.length} className="new" />
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

const Form = props => (
	<div id="form">
		<FormPointer mode={props.mode} />
		<FormInput {...props} />
	</div>
);

const GuideKey = ({children, label}) => (
	<div className="keyGroup">
		<div className="key">{label}</div>
		<div className="content">{children}</div>
	</div>
);

const Guide = ({show}) => (
	<div id="guide" className={show ? 'show' : ''}>
		<h2>How to use</h2>
		<p>
			Click on the keyboard buttons to press,<br />
			or enter the seat to type with your real keyboard.
		</p>
		<p>
			<GuideKey label="Tab ↹">
				Change input language<br />
				入力言語を変更します
			</GuideKey>
			<GuideKey label="Space">
				Cycle through suggestions (JP mode)<br />
				変換候補を切り替えます (JPモード)
			</GuideKey>
			<GuideKey label="Enter">
				Confirm selection (JP mode)<br />
				変換を確定します (JPモード)
			</GuideKey>
			<GuideKey label="Home">
				Center your view (in VR)<br />
				方向にリセットします (VRで)
			</GuideKey>
		</p>
		<p><small>
			To type with your keyboard, make sure the game is selected in Windows.<br />
			Centering tip, move to a comfortable position in front of your keyboard.
			Then press the <code>[Home]</code> button.
		</small></p>
	</div>
);

exports.App = props => (
	<div id="app">
		<Guide show={props.showGuide} />
		<Logs {...props} />
		<Form {...props} />
	</div>
);
