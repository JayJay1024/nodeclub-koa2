'use strict';

const mongoose = require('mongoose'),
      config   = require('../config'),
      logger   = require('../common/logger');

mongoose.connect(config.db_mongo, {
    poolSize: 20,
    useCreateIndex: true,
    useNewUrlParser: true,
}).then(() => {
    // ready to use. The `mongoose.connect()` promise resolves to undefined
}).catch((err) => {
    // handle initial connection error
    if (err) {
        logger.error('connect to %s error: ', config.db_mongo, err.message);
        process.exit(1);
    }
});

// models
require('./user');
require('./topic');
require('./reply');
require('./topic_collect');
require('./message');

exports.User         = mongoose.model('User');
exports.Topic        = mongoose.model('Topic');
exports.Reply        = mongoose.model('Reply');
exports.TopicCollect = mongoose.model('TopicCollect');
exports.Message      = mongoose.model('Message');
