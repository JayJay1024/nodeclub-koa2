'use strict';

const redis  = require('../common/redis'),
      logger = require('../common/logger');

exports.get = async (key) => {
    let t = new Date();
    let data = await redis.get(key);
    if (data) {
        data = JSON.parse(data);
    }
    let duration = (new Date() - t);
    logger.debug(`Cache get ${key} (${duration}ms)`);
    return data;
};

/**
 * time 参数可选，秒为单位
 */
exports.set = async (key, value, time) => {
    let ret;
    let t = new Date();
    value = JSON.stringify(value);

    if (!time) {
        ret = await redis.set(key, value);
    } else {
        ret = await redis.setex(key, time, value);
    }

    let duration = (new Date() - t);
    logger.debug(`Cache set ${key} (${duration}ms)`);
    return ret;
};
