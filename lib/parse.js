/* --------------------
 * @overlookmotel/srt module
 * Parse SRT
 * ------------------*/

'use strict';

// Modules
const {last} = require('lodash');

// Constants
const NUM_REGEX = /^(\s*)(\d+)(\s*)$/,
	TC_REGEX = /^(\s*)(\d+):(\d+):(\d+),(\d+)(\s*-?->\s*)(\d+):(\d+):(\d+),(\d+)(\s*)$/,
	DEFAULT_DURATION = 1000; // 1 second

// Exports

module.exports = parse;

/**
 * Parse SRT file.
 *
 * Errors which might prevent another program parsing the SRT are corrected in `subtitles` returned.
 * If file cannot be parsed at all, `subtitles` returned is `null`.
 *
 * Problems found are detailed in the `problems` array.
 * As long as `subtitles` is not `null`, a new SRT made by stringifying the returned `subtitles`
 * should be valid. But any problems which are flagged `canFix: false` should have human
 * intervention to fix properly.
 *
 * `srt` returned does not include the corrections - it's purely the input with BOM removed
 * and line breaks conformed to '\n'.
 *
 * @param {string} srt - SRT file as string
 * @returns {Object}
 * @returns {Array<Object>|null} .subtitles - Array of subtitle objects of form `{start, end, text}`.
 *   `start` and `end` are start and end time in milliseconds.
 *   `text` is the the text of the subtitle.
 * @returns {Array<Object>} .problems - Array of problems of form `{index, msg, canFix}`.
 *   `index` is index of subtitle where problem found.
 *   `msg` describes the problem.
 *   `canFix` is `false` if problem should be corrected by eye.
 * @returns {string} .srt - SRT input text with line breaks conformed to '\n' and BOM removed
 */
function parse(srt) {
	// Check if line breaks are consistent, and conform all to `\n`
	const problems = [];
	if (srt.includes('\r')) {
		if (/[^\r]\n/.test(srt) || /\r[^\n]/.test(srt)) {
			problems.push({index: 0, msg: 'Inconsistent line breaks', canFix: true});
		}
		srt = srt.replace(/\r\n?/gu, '\n');
	}

	// Parse file
	const lines = srt.split('\n');

	// Remove empty lines at start
	let lineNum = 0;
	while (lines[lineNum] === '') {
		lineNum++;
	}
	if (lineNum > 0) {
		problems.push({index: 0, msg: `${lineNum} empty lines before first subtitle`, canFix: true});
	}

	// Check first two lines are a number and timecode
	if (!NUM_REGEX.test(lines[lineNum])) {
		problems.push({index: 0, msg: 'Invalid first line', canFix: false});
		return {subtitles: null, problems, srt};
	}

	if (!TC_REGEX.test(lines[lineNum + 1])) {
		problems.push({index: 0, msg: 'Invalid 2nd line', canFix: false});
		return {subtitles: null, problems, srt};
	}

	// Parse into subtitles
	const subtitles = [];
	let index = 0,
		previousEnd = 0;
	while (lineNum < lines.length) {
		function addProblem(msg, canFix) { // eslint-disable-line no-inner-declarations, no-loop-func
			if (canFix === undefined) canFix = true;
			problems.push({index, msg, canFix});
		}

		// Parse subtitle number
		let line = lines[lineNum];
		const [, spaceBeforeNum, numStr, spaceAfterNum] = line.match(NUM_REGEX);
		if (spaceBeforeNum || spaceAfterNum) addProblem(`Excess spacing around subtitle number: '${line}'`);
		if (numStr[0] === '0') addProblem(`Zero-prefixed subtitle number: ${numStr}`);
		const num = numStr * 1;
		if (num !== index + 1) addProblem(`Incorrect subtitle number: ${num} not ${index + 1}`);
		lineNum++;

		// Parse, validate and correct timecode
		line = lines[lineNum];
		const [,
			spaceBefore, startHours, startMins, startSecs, startMs, arrow,
			endHours, endMins, endSecs, endMs, spaceAfter
		] = line.match(TC_REGEX);
		if (
			spaceBefore || spaceAfter || arrow !== ' --> '
			|| !validateTcParts(startHours, startMins, startSecs, startMs)
			|| !validateTcParts(endHours, endMins, endSecs, endMs)
		) addProblem('Malformed timecode line');

		let start = timecodeToMs(startHours, startMins, startSecs, startMs),
			end = timecodeToMs(endHours, endMins, endSecs, endMs);

		let hasInvalidTimecode = false;
		if (start === null) {
			start = previousEnd;
			hasInvalidTimecode = true;
		}
		if (end === null) {
			end = start + DEFAULT_DURATION;
			hasInvalidTimecode = true;
		}

		if (hasInvalidTimecode) addProblem('Invalid timecode', false);
		if (end <= start) {
			addProblem(`Subtitle end time is ${end === start ? 'same as' : 'before'} start time`, false);
			end = start + DEFAULT_DURATION;
		}
		if (start < previousEnd) {
			addProblem('Subtitle starts before previous ends', false);
			start = previousEnd;
			if (end <= start) end = start + DEFAULT_DURATION;
		}

		lineNum++;

		// Parse text
		let textLines = [];
		while (lineNum < lines.length) {
			line = lines[lineNum];
			if (lineNum < lines.length - 1 && NUM_REGEX.test(line) && TC_REGEX.test(lines[lineNum + 1])) break;
			textLines.push(line.trim() === '' ? '' : line);
			lineNum++;
		}

		// Check for empty lines at start or end of text
		let numEmptyLinesAtStart = 0;
		while (textLines.length > 0 && textLines[0] === '') {
			textLines.shift();
			numEmptyLinesAtStart++;
		}

		let numEmptyLinesAtEnd = 0;
		while (textLines.length > 0 && last(textLines) === '') {
			textLines.pop();
			numEmptyLinesAtEnd++;
		}

		// Check for empty lines within text
		const textLinesWithoutEmpty = textLines.filter(textLine => textLine !== '');
		if (textLinesWithoutEmpty.length !== textLines.length) {
			textLines = textLinesWithoutEmpty;
			addProblem('Line breaks in middle of subtitle');
		}

		if (textLines.length === 0) {
			addProblem('Empty subtitle', false);
			textLines = ['_'];
		} else {
			if (numEmptyLinesAtStart) addProblem('Empty lines at start of subtitle');
			if (numEmptyLinesAtEnd === 0) {
				addProblem('No line break after end of subtitle');
			} else if (numEmptyLinesAtEnd > 1) {
				addProblem('Too many line breaks after end of subtitle');
			}
		}

		subtitles.push({start, end, text: textLines.join('\n')});

		index++;
		previousEnd = end;
	}

	if (subtitles.length === 0) {
		problems.push({index: 0, msg: 'File contains no subtitles', canFix: false});
	}

	return {subtitles, problems, srt};
}

function validateTcParts(hours, mins, secs, ms) {
	return hours.length === 2 && mins.length === 2 && secs.length === 2 && ms.length === 3;
}

function timecodeToMs(hoursStr, minsStr, secsStr, msStr) {
	const [hours, mins, secs, ms] = [hoursStr, minsStr, secsStr, msStr].map(n => n * 1);
	if (mins > 59 || secs > 59 || ms > 999) return null;
	return (((hours * 60) + mins) * 60 + secs) * 1000 + ms;
}
