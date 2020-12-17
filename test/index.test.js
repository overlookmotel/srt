/* --------------------
 * @overlookmotel/srt module
 * Tests
 * ------------------*/

'use strict';

// Modules
const srt = require('@overlookmotel/srt');

// Init
require('./support/index.js');

// Tests

describe('tests', () => {
	it.skip('all', () => { // eslint-disable-line jest/no-disabled-tests
		expect(srt).not.toBeUndefined();
	});
});
