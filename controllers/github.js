'use strict';

const UserModel      = require('../models').User;
const authMiddleWare = require('../middlewares/auth');
const tools          = require('../common/tools');
const logger         = require('../common/logger');
const uuid           = require('node-uuid');
const validator      = require('validator');

exports.callback = async (ctx, next) => {
    let profile = ctx.state.user;
    let email = profile.emails && profile.emails[0] && profile.emails[0].value;

    try {
        let user = await UserModel.findOne({githubId: profile.id});
        if (user) {
            // 当用户已经是已存在时，通过 github 登陆将会更新他的资料
            user.githubUsername    = profile.username;
            user.githubId          = profile.id;
            user.githubAccessToken = profile.accessToken;
            // user.loginname      = profile.username;
            user.avatar            = profile._json.avatar_url;
            user.email             = email || user.email;
            await user.save();

            authMiddleWare.gen_session(user, ctx);
            await ctx.redirect('/');
        } else {
            // 如果用户还未存在，则建立新用户

            // 删除一些没用的，否则超出session保存大小
            let _json = profile._json;
            delete profile._raw;
            delete profile._json;

            delete _json.followers_url;
            delete _json.following_url;
            delete _json.starred_url;
            delete _json.subscriptions_url;
            delete _json.received_events_url;
            delete _json.public_repos;
            delete _json.public_gists;
            delete _json.followers;
            delete _json.following;

            profile._json = _json;
            ctx.session.profile = profile;
            await ctx.redirect('/auth/github/new');
        }
        return await next();
    } catch (err) {
        logger.error(err);

        // 根据 err.err 的错误信息决定如何回应用户，这个地方写得很难看
        if (err.message) {
            if (err.message.indexOf('duplicate key error') !== -1) {
                if (err.message.indexOf('email') !== -1) {
                    ctx.status = 500;
                    await ctx.render('sign/no_github_email');
                    return await next();
                }
                if (err.message.indexOf('loginname') !== -1) {
                    await ctx.renderError('您 GitHub 账号的用户名与之前在 CNodejs 注册的用户名重复了', 500);
                    return await next();
                }
            }
        }
    }

    await ctx.render('notify/notify', {error: '联系管理员。'});
};

/**
 * 注册新账号，或关联旧账号
 */
exports.new = async (ctx, next) => {
    await ctx.render('sign/new_oauth', {actionPath: '/auth/github/create'});
    await next();
};

exports.create = async (ctx, next) => {
    let profile = ctx.session.profile;
    if (!profile) {
        return await ctx.redirect('/signin');
    }
    delete ctx.session.profile;

    let email     = profile.emails && profile.emails[0] && profile.emails[0].value;
    let isnew     = ctx.request.body.isnew;
    let loginname = validator.trim(ctx.request.body.name || '').toLowerCase();
    let password  = validator.trim(ctx.request.body.pass || '');

    try {
        if (isnew) {
            // 注册新账号
            let user = new UserModel({
                loginname: profile.username,
                pass: profile.accessToken,
                email: email,
                avatar: profile._json.avatar_url,
                githubId: profile.id,
                githubUsername: profile.username,
                githubAccessToken: profile.accessToken,
                active: true,
                accessToken: uuid.v4(),
            });
            await user.save();
            authMiddleWare.gen_session(user, ctx);
        } else {
            // 关联老账号
            let user = await UserModel.findOne({loginname: loginname});
            let bool = await tools.bcompare(password, user.pass);
            if (!bool) {
                ctx.status(403);
                return await ctx.render('sign/signin', {error: '账号名或密码错误。'});
            }

            user.githubUsername    = profile.username;
            user.githubId          = profile.id;
            // user.loginname      = profile.username;
            user.avatar            = profile._json.avatar_url;
            user.githubAccessToken = profile.accessToken;
            await user.save();
            authMiddleWare.gen_session(user, ctx);
        }
        await ctx.redirect('/');
        return await next();
    } catch (err) {
        logger.error(err);

        // 根据 err.err 的错误信息决定如何回应用户，这个地方写得很难看
        if (err.message) {
            if (err.message.indexOf('duplicate key error') !== -1) {
                if (err.message.indexOf('email') !== -1) {
                    ctx.status = 500;
                    return await ctx.render('sign/no_github_email');
                }
                if (err.message.indexOf('loginname') !== -1) {
                    await ctx.renderError('您 GitHub 账号的用户名与之前在 CNodejs 注册的用户名重复了', 500);
                }
            }
        }
    }

    await ctx.render('notify/notify', {error: '联系管理员。'});
};
