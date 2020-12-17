/* --------------------
 * @overlookmotel/srt module
 * Entry point
 * ------------------*/

'use strict';

// Imports
const parse = require('./parse.js'),
	stringify = require('./stringify.js'),
	conform = require('./conform.js'),
	{timecodeToMs, msToTimecode} = require('./timecode.js'),
	{detectBom, fileBufferToString} = require('./bom.js');

// Exports

module.exports = {
	parse,
	stringify,
	conform,
	timecodeToMs,
	msToTimecode,
	detectBom,
	fileBufferToString
};
