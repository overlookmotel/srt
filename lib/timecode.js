/* --------------------
 * @overlookmotel/srt module
 * Timecode functions
 * ------------------*/

'use strict';

// Exports

module.exports = {
	msToTimecode
};

function msToTimecode(msTotal) {
	const ms = msTotal % 1000,
		secsTotal = (msTotal - ms) / 1000,
		secs = secsTotal % 60,
		minsTotal = (secsTotal - secs) / 60,
		mins = minsTotal % 60,
		hours = (minsTotal - mins) / 60;
	return `${zeroPad(hours, 2)}:${zeroPad(mins, 2)}:${zeroPad(secs, 2)},${zeroPad(ms, 3)}`;
}

function zeroPad(num, len) {
	let str = `${num}`;
	while (str.length < len) str = `0${str}`;
	return str;
}
