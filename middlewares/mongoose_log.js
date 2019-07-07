'use strict';

const mongoose = require('mongoose'),
      logger   = require('../common/logger'),
      config   = require('../config');

if (config.debug) {
    const traceMQuery = (method, info, query) => {
        return (err, result, millis) => {
            if (err) {
                logger.error('traceMQuery error:\n', err);
            }

            let infos = [];
            infos.push(query._collection.collection.name + "." + method);
            infos.push(JSON.stringify(info));
            infos.push((millis + 'ms'));

            logger.debug("traceMQuery: ", infos.join(' '));
        }
    };
    mongoose.Mongoose.prototype.mquery.setGlobalTraceFunction(traceMQuery);
}
