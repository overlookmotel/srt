/* --------------------
 * @overlookmotel/srt module
 * BOM utility methods
 * ------------------*/

'use strict';

// Exports

module.exports = {
	detectBom,
	fileBufferToString
};

/**
 * Detect BOM in file buffer.
 * Returns type of BOM.
 * @param {Buffer} buf - File buffer
 * @returns {string|null} - 'utf8' / 'utf16le' / 'utf16be' / `null` (if no BOM)
 */
function detectBom(buf) {
	const first = buf[0];
	if (first === 255) {
		if (buf[1] === 254) return 'utf16le';
	} else if (first === 254) {
		if (buf[1] === 255) return 'utf16be';
	} else if (first === 239 && buf[1] === 187 && buf[2] === 191) {
		return 'utf8';
	}
	return undefined;
}

/**
 * Convert file buffer to string, taking into account BOM.
 * BOM will be removed, and string parsed, taking into account encoding according to BOM.
 * @param {Buffer} buf - File buffer
 * @param {string|null} bomType - BOM type (as determined by `detectBom()`)
 * @returns {string} - File contents as string
 */
function fileBufferToString(buf, bomType) {
	let bomLen;
	if (bomType === 'utf8') {
		bomLen = 3;
	} else if (bomType === 'utf16le') {
		bomLen = 2;
	} else if (bomType === 'utf16be') {
		bomLen = 2;

		// Convert to little endian
		for (let i = 0; i < buf.length; i += 2) {
			const c = buf[i];
			buf[i] = buf[i + 1];
			buf[i + 1] = c;
		}

		bomType = 'utf16le';
	} else {
		bomType = 'utf8';
		bomLen = 0;
	}

	return buf.toString(bomType, bomLen);
}
