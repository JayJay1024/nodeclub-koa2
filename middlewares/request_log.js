'use strict';

const logger = require('../common/logger');

module.exports = async (ctx, next) => {
    let t = new Date();
    logger.info('Started', t.toISOString(), ctx.method, ctx.url, ctx.ip);
    await next();
    let duration = ((new Date()) - t);
    logger.info('Completed', ctx.status, '(' + duration + 'ms)');
}
