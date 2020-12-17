/* --------------------
 * @overlookmotel/srt module
 * Stringify subtitles to SRT
 * ------------------*/

'use strict';

// Imports
const {msToTimecode} = require('./timecode.js');

// Exports

module.exports = stringify;

/**
 * Stringify subtitles as SRT file.
 * @param {Array<Object>} subtitles - Array of subtitle objects (as returned by `parse()`)
 * @returns {string} - Subtitles as SRT file string
 */
function stringify(subtitles) {
	if (subtitles.length === 0) return '';

	/* eslint-disable prefer-template */
	return subtitles.map((subtitle, index) => (
		`${index + 1}\n`
			+ `${msToTimecode(subtitle.start)} --> ${msToTimecode(subtitle.end)}\n`
			+ subtitle.text
	)).join('\n\n') + '\n';
	/* eslint-enable prefer-template */
}
