'use strict';

const nock  = require('nock');
const redis = require('../common/redis');

redis.flushdb();         // 清空 db 里面的所有内容
nock.enableNetConnect(); // 允许真实的网络连接
