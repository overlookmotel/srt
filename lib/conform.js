/* --------------------
 * @overlookmotel/srt module
 * Conform subtitles
 * ------------------*/

'use strict';

// Modules
const {uniq} = require('lodash');

// Constants
const MAX_LINES_PER_SUB = 2,
	MAX_LINE_LENGTH = 45,
	MIN_DURATION = 1000,
	FIRST_SUB_START_MIN = 500,
	MIN_GAP_BETWEEN_SUBS = 200;

// Exports

module.exports = {
	conform,
	validate
};

/**
 * Conform subtitles according to style guide.
 *
 * Returns `subtitles` array with fixes made + array of problem details `problems`.
 * Any problems which are flagged `canFix: false` cannot be fixed and require human intervention.
 *
 * @param {Array<Object>} subtitles - Array of subtitle objects (as created by `parse()`)
 * @returns {Object}
 * @returns {Array<Object>} .subtitles - Same format as returned by `parse()`
 * @returns {Array<Object>} .problems - Array of problems of form `{index, msg, canFix}`.
 *   `index` is index of subtitle where problem found.
 *   `msg` describes the problem.
 *   `canFix` is `false` if problem should be corrected by eye.
 */
function conform(subtitles) {
	// Check first sub starts some time after start of file (currently 500ms)
	const problems = [];

	const firstSub = subtitles[0];
	if (firstSub.start < FIRST_SUB_START_MIN) {
		problems.push({
			index: 0,
			msg: `First subtitle begins before ${FIRST_SUB_START_MIN} ms`,
			canFix: false
		});
	}

	// Conform all subtitles,
	const subtitlesConformed = [];
	subtitles.forEach((subtitle, index) => {
		const {start} = subtitle;
		let {text, end} = subtitle;

		function addProblem(msg, canFix) {
			problems.push({index, msg, canFix});
		}

		function runConform(fn, msg) {
			const newText = fn(text);
			if (newText !== text) {
				text = newText;
				addProblem(msg, true);
			}
		}

		// Remove double-spacing + convert tabs to spaces
		runConform(t => t.replace(/\t/gu, ' ').replace(/  +/gu, ' '), 'Excess spacing');

		// Remove spacing around line breaks
		runConform(t => t.replace(/\s*\n\s*/gu, '\n').trim(), 'Spaces at start or end of lines');

		// Replace ellipsis characters with '...'
		runConform(t => t.replace(/…/gu, '...'), 'Ellipsis character');

		// Convert ".." to "..."
		runConform(
			t => t.replace(/([^.]|^)\.\.([^.]|$)/gu, (whole, before, after) => `${before}...${after}`),
			'Double dots not triple dots'
		);

		// Convert "...." to "..."
		runConform(t => t.replace(/\.\.\.\.+/gu, '...'), 'More than 3 dots in a row');

		// Convert "word...word" to "word... word"
		runConform(
			t => t.replace(/([^\s]\.\.\.)([^\s])/g, (whole, before, after) => `${before} ${after}`),
			'No space after ...'
		);

		// Replace long hyphens with short hyphens
		runConform(t => t.replace(/–/g, '-'), 'Long hyphen not short hyphen');

		// Add spaces after hyphens at start of lines
		runConform(
			t => t.replace(/(\n|^)-([^ ])/g, (whole, before, after) => `${before}- ${after}`),
			'No space after hyphen'
		);

		// Convert non-standard quotes to ASCII quotes
		runConform(
			t => t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'"),
			'Non-standard quotation marks/apostrophes'
		);

		// Convert `#` to `♪`
		runConform(t => t.replace(/#/g, '♪'), 'Hash character instead of musical note');

		// Extend subtitles which are too short
		const nextStart = index < subtitles.length - 1 ? subtitles[index + 1].start : null;
		const duration = end - start;
		if (duration < MIN_DURATION) {
			end = start + MIN_DURATION;
			const cannotFullyFix = (nextStart !== null && end > nextStart);
			if (cannotFullyFix) end = nextStart;
			addProblem(`Subtitle duration ${duration} ms under ${MIN_DURATION} ms`, !cannotFullyFix);
		}

		// Extend subtitles which have a short gap before next sub
		if (nextStart !== null && end !== nextStart && end + MIN_GAP_BETWEEN_SUBS > nextStart) {
			addProblem(`Short gap before next subtitle (less than ${MIN_GAP_BETWEEN_SUBS} ms)`, true);
			end = nextStart;
		}

		// Check for subs running to too many lines
		const lines = text.split('\n');
		if (lines.length > MAX_LINES_PER_SUB) addProblem(`Subtitle at has ${lines.length} lines`, false);

		// Check for long lines
		const maxLen = Math.max(...lines.map(line => line.length));
		if (maxLen > MAX_LINE_LENGTH) {
			addProblem(`Line length ${maxLen} exceeds recommended ${MAX_LINE_LENGTH} max`, false);
		}

		// Check for non-ASCII chars
		const nonAsciiChars = text.match(/[^A-Za-z0-9,.;:?!()\-'"%/&♪ \n]/gu);
		if (nonAsciiChars) {
			addProblem(`Subtitle contains non-ascii chars ${uniq(nonAsciiChars).join('')}`, false);
		}

		subtitlesConformed.push({start, end, text});
	});

	return {subtitles: subtitlesConformed, problems};
}

/**
 * Validate subtitles according to style guide.
 * @param {Array<Object>} subtitles - Array of subtitle objects (as created by `parse()`)
 * @returns {Array<Object>} - Array of problems found (same as `.problems` returned by `conform()`)
 */
function validate(subtitles) {
	const {problems} = conform(subtitles);
	return problems;
}
