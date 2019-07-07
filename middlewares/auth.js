'use strict';

const config       = require('../config');
const logger       = require('../common/logger');
const UserModel    = require('../models').User;
const UserProxy    = require('../proxy').User;
const MessageProxy = require('../proxy').Message;

/**
 * 需要管理员权限
 */
exports.adminRequired = async (ctx, next) => {
    if (!ctx.session.user) {
        return await ctx.render('notify/notify', {error: '你还没有登录'});
    }
    if (!ctx.session.user.is_admin) {
        return await ctx.render('notify/notify', {error: '需要管理员权限'});
    }
    await next();
};

/**
 * 需要登录
 */
exports.userRequired = async (ctx, next) => {
    if (!ctx.session || !ctx.session.user || !ctx.session.user._id) {
        return await ctx.renderError('forbidden', 403);
    }
    await next();
};

exports.gen_session = (user, ctx) => {
    let auth_token = user._id + '$$$$';  // 以后可能会存储更多信息，用 $$$$ 来分隔
    let opts = {
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,  // cookie 有效期 7 天
    };
    ctx.cookies.set(config.auth_cookie_name, auth_token, opts);
};

/**
 * 用户是否被屏蔽
 */
exports.blockUser = async (ctx, next) => {
    if (ctx.session.user && ctx.session.user.is_block && ctx.path !== '/signout' && ctx.method !== 'GET') {
        return await ctx.renderError('你被管理员屏蔽了，有疑问请联系管理员', 403);
    }
    await next();
};

/**
 * 验证用户是否登录
 */
exports.authUser = async (ctx, next) => {
    ctx.state.current_user = null;  // reset and ensure current_user always has defined

    if (config.debug && ctx.session.mock_user) {
        let mockUser = JSON.parse(ctx.session.mock_user);
        ctx.session.user = new UserModel(mockUser);
        if (mockUser.is_admin) {
            ctx.session.user.is_admin = true;
        }
        return await next();
    }

    let user = null;
    let auth_token = ctx.cookies.get(config.auth_cookie_name, {signed: true});  // 所请求的cookie应该被签名

    if (ctx.session.user) {
        user = ctx.session.user;
    } else if (auth_token) {
        let user_id = auth_token.split('$$$$')[0];
        user = await UserProxy.getUserById(user_id);
    }

    if (user) {
        user = new UserModel(user);
        if (config.admins.hasOwnProperty(user.loginname)) {
            user.is_admin = true;
        }
        user.messages_count = await MessageProxy.getMessagesCount(user._id);

        // 核心是设置这两个
        ctx.session.user = user;
        ctx.state.current_user = user;
    }
    return await next();
};
