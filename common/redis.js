'use strict';

const config = require('../config'),
      logger = require('../common/logger'),
      Redis  = require('ioredis');

const client = new Redis({
    port: config.redis_port,
    host: config.redis_host,
    db: config.redis_db,
    password: config.redis_password,
});

client.on('error', (err) => {
    if (err) {
        logger.error('connect to redis error, check your redis config:\n', err);
        process.exit(1);
    }
});

exports = module.exports = client;
