'use strict';

// const config = require('../config');
const cache  = require('../common/cache');
const moment = require('moment');

const SEPARATOR = '^_^@T_T';

const makePerDayLimiter = (identityName, identityFn) => {
    return (name, limitCount, options) => {
        // options.showJson = true 表示调用来自API，返回结构化数据；否则表示调用来自前端，渲染错误页面
        return async (ctx, next) => {
            let identity = identityFn(ctx);
            let YYYYMMDD = moment().format('YYYYMMDD');
            let key      = YYYYMMDD + SEPARATOR + identityName + SEPARATOR + name + SEPARATOR + identity;

            let count = (await cache.get(key)) || 0;
            if (count < limitCount) {
                count += 1;
                await cache.set(key, count, 60 * 60 * 24);
                ctx.set('X-RateLimit-Limit', limitCount);
                ctx.set('X-RateLimit-Remaining', limitCount - count);
                await next();
            } else {
                ctx.status = 403;
                if (options.showJson) {
                    ctx.type = 'application/json';
                    ctx.body = {success: false, error_msg: '频率限制：当前操作每天可以进行 ' + limitCount + ' 次'};
                } else {
                    await ctx.render('notify/notify', {error: '频率限制：当前操作每天可以进行 ' + limitCount + ' 次'});
                }
            }
        }
    }
};

exports.peruserperday = makePerDayLimiter('peruserperday', (ctx) => {
    return (ctx.state.user || ctx.session.user || ctx.user).loginname;
});

exports.peripperday = makePerDayLimiter('peripperday', (ctx) => {
    // let realIP = ctx.get('x-real-ip');
    // if (!realIP && !config.debug) {
    //     throw new Error('should provide `x-real-ip` header');
    // }
    // return realIP;
    return ctx.request.ip;
});
