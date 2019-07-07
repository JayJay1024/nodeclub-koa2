'use strict';

const UserModel = require('../../models').User;
const logger    = require('../../common/logger');
const validator = require('validator');

/**
 * 非登录用户直接屏蔽
 */
const auth = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let accessToken = String(ctx.request.body.accesstoken || ctx.query.accesstoken || '');
        accessToken = validator.trim(accessToken);

        let user = await UserModel.findOne({accessToken: accessToken});
        if (!user) {
            ctx.status = 401;
            return ctx.body = {success: false, error_msg: '错误的accessToken'};
        }
        if (user.is_block) {
            return ctx.body = {success: false, error_msg: '您的账户被禁用'};
        }

        ctx.user = user;
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.auth = auth;

/**
 * 非登录用户也可通过
 * @param {*} ctx 
 * @param {*} next 
 */
const tryAuth = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let accessToken = String(ctx.request.body.accesstoken || ctx.query.accesstoken || '');
        accessToken = validator.trim(accessToken);

        let user = await UserModel.findOne({accessToken: accessToken});
        if (user && user.is_block) {
            return ctx.body = {success: false, error_msg: '您的账户被禁用'};
        }

        ctx.user = user;
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.tryAuth = tryAuth;
