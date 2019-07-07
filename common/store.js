'use strict';

const qn    = require('./store_qn');
const local = require('./store_local');

module.exports = qn || local;
