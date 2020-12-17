/* --------------------
 * @overlookmotel/srt module
 * Entry point
 * ------------------*/

'use strict';

// Imports
const parse = require('./parse.js'),
	stringify = require('./stringify.js'),
	{conform, validate} = require('./conform.js'),
	{timecodeToMs, msToTimecode} = require('./timecode.js'),
	{detectBom, fileBufferToString} = require('./bom.js');

// Exports

module.exports = {
	parse,
	stringify,
	conform,
	validate,
	timecodeToMs,
	msToTimecode,
	detectBom,
	fileBufferToString
};
