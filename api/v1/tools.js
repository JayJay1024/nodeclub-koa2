'use strict';

const logger = require('../../common/logger');

const accessToken = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        ctx.body = {
            success: true,
            loginname: ctx.user.loginname,
            avatar_url: ctx.user.avatar_url,
            id: ctx.user._id
        };
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.accessToken = accessToken;
