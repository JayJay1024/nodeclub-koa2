'use strict';

const qn     = require('qn'),
      config = require('../config');

// 七牛 client
let qnClient = null;
if (config.qn_access && config.qn_access.secretKey !== 'your secret key') {
    qnClient = qn.create(config.qn_access);
}

module.exports = qnClient;
