'use strict';

const config         = require('../config'),
      UserProxy      = require('../proxy').User,
      authMiddleWare = require('../middlewares/auth'),
      mail           = require('../common/mail'),
      tools          = require('../common/tools'),
      validator      = require('validator'),
      utility        = require('utility'),
      uuid           = require('node-uuid');

/**
 * sign up
 */
exports.showSignup = async (ctx, next) => {
    await ctx.render('sign/signup');
    await next();
};
exports.signup = async (ctx, next) => {
    let loginname = validator.trim(ctx.request.body.loginname).toLowerCase();
    let email     = validator.trim(ctx.request.body.email).toLowerCase();
    let pass      = validator.trim(ctx.request.body.pass);
    let rePass    = validator.trim(ctx.request.body.re_pass);

    // 验证信息正确性
    let prop_err = null;
    if ([loginname, email, pass, rePass].some(item => { return item === ''; })) {
        prop_err = '信息不完整。';
    } else if (loginname.length < 5) {
        prop_err = '用户名至少需要5个字符。';
    } else if (!tools.validateId(loginname)) {
        prop_err = '用户名不合法。';
    } else if (!validator.isEmail(email)) {
        prop_err = '邮箱不合法。';
    } else if (pass !== rePass) {
        prop_err = '两次密码输入不一致。';
    }
    if (prop_err) {
        ctx.status = 422;
        return await ctx.render('sign/signup', {error: prop_err, loginname: loginname, email: email});
    }

    let users = await UserProxy.getUsersByQuery({$or: [{loginname: loginname}, {email: email}]});
    if (users.length) {
        prop_err = '用户名或邮箱已被使用。';
        ctx.status = 422;
        return await ctx.render('sign/signup', {error: prop_err, loginname: loginname, email: email});
    }

    let passhash  = await tools.bhash(pass);
    let avatarUrl = UserProxy.makeGravatar(email);

    await UserProxy.newAndSave(loginname, loginname, passhash, email, avatarUrl);
    await mail.sendActiveMail(email, utility.md5(email+passhash+config.session_secret), loginname);

    await ctx.render('sign/signup', {
        success: `欢迎加入${config.name}！我们已经给您的注册邮箱发送了一封邮件，请点击里面的链接来激活您的账号。`,
    });
    await next();
};

/**
 * Show user login page.
 */
exports.showLogin = async (ctx, next) => {
    ctx.session._loginReferer = ctx.headers.referer;
    await ctx.render('sign/signin');
    await next();
};

/**
 * define some page when login just jump to the home page
 * @type {Array}
 */
const notJump = [
    '/active_account', // active page
    '/reset_pass',     // reset password page, avoid to reset twice
    '/signup',         // regist page
    '/search_pass'     // serch pass page
];

/**
 * Handle user login
 */
exports.login = async (ctx, next) => {
    let loginname = validator.trim(ctx.request.body.name).toLowerCase();
    let pass      = validator.trim(ctx.request.body.pass);

    if (!loginname || !pass) {
        ctx.status = 422;
        return await ctx.render('sign/signin', {error: '信息不完整。'});
    }

    let handleGetUser;
    if (loginname.indexOf('@') !== -1) {
        handleGetUser = UserProxy.getUserByMail;
    } else {
        handleGetUser = UserProxy.getUserByLoginName;
    }

    let user = await handleGetUser(loginname);
    if (!user) {
        ctx.status = 403;
        return await ctx.render('sign/signin', {error: '用户不存在。'});
    }

    let passhash = user.pass;
    let bool = await tools.bcompare(pass, passhash);
    if (!bool) {
        ctx.status = 403;
        return await ctx.render('sign/signin', {error: '密码错误。'});
    }

    if (!user.active) {
        await mail.sendActiveMail(user.email, utility.md5(user.email+passhash+config.session_secret), user.loginname);
        ctx.status = 403;
        return await ctx.render('sign/signin', {error: `此帐号还没有被激活，激活链接已发送到 ${user.email} 邮箱，请查收。`});
    }

    authMiddleWare.gen_session(user, ctx);

    // check at some page just jump to home page
    let refer = ctx.session._loginReferer || '/';
    for (let p of notJump) {
        if (refer.indexOf(p) >= 0) {
            refer = '/';
            break;
        }
    }
    await ctx.redirect(refer);
    await next();
};

/**
 * sign out
 */
exports.signout = async (ctx, next) => {
    ctx.session = null;
    ctx.cookies.set(config.auth_cookie_name, '', {maxAge: 0});
    await ctx.redirect('/');
    await next();
};

exports.activeAccount = async (ctx, next) => {
    let key  = validator.trim(ctx.query.key);
    let name = validator.trim(ctx.query.name);

    let user = await UserProxy.getUserByLoginName(name);
    if (user) {
        let passhash = user.pass;
        if (utility.md5(user.email+passhash+config.session_secret) !== key) {
            return await ctx.render('notify/notify', {error: '信息有误，账号无法被激活。'});
        }

        if (user.active) {
            return await ctx.render('notify/notify', {error: '账号已经是激活状态。'});
        }

        user.active = true;
        await user.save();
        await ctx.render('notify/notify', {success: '账号已被激活，请登录。'});
        await next();
    } else {
        return await ctx.render('notify/notify', {error: '账号不存在。'});
    }
};

exports.showSearchPass = async (ctx, next) => {
    await ctx.render('sign/search_pass');
    await next();
};

exports.updateSearchPass = async (ctx, next) => {
    let email = validator.trim(ctx.request.body.email).toLowerCase();
    if (!validator.isEmail(email)) {
        return await ctx.render('sign/search_pass', {error: '邮箱不合法。', email: email});
    }

    // 动态生成retrive_key和timestamp到users collection，之后重置密码进行验证
    let retrieveKey  = uuid.v4();
    let retrieveTime = new Date().getTime();

    let user = await UserProxy.getUserByMail(email);
    if (!user) {
        return await ctx.render('sign/search_pass', {error: '没有这个电子邮箱。', email: email});
    }

    user.retrieve_key  = retrieveKey;
    user.retrieve_time = retrieveTime;
    await user.save();
    await mail.sendResetPassMail(email, retrieveKey, user.loginname);
    await ctx.render('notify/notify', {success: '我们已给您填写的电子邮箱发送了一封邮件，请在24小时内点击里面的链接来重置密码。'});
    return await next();
};

/**
 * reset password
 * 'get' to show the page, 'post' to reset password
 * after reset password, retrieve_key&time will be destroy
 */
exports.resetPass = async (ctx, next) => {
    let key  = validator.trim(ctx.query.key  || '');
    let name = validator.trim(ctx.query.name || '');

    let user = await UserProxy.getUserByNameAndKey(name, key);
    if (!user) {
        ctx.status = 403;
        return await ctx.render('notify/notify', {error: '信息有误，密码无法重置。'});
    }

    let now    = new Date().getTime();
    let oneDay = 1000 * 60 * 60 * 24;
    if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
        ctx.status = 403;
        return await ctx.render('notify/notify', {error: '该链接已过期，请重新申请。'});
    }

    await ctx.render('sign/reset', {name: name, key: key});
    await next();
};

exports.updatePass = async (ctx, next) => {
    let psw   = validator.trim(ctx.request.body.psw)   || '';
    let repsw = validator.trim(ctx.request.body.repsw) || '';
    let key   = validator.trim(ctx.request.body.key)   || '';
    let name  = validator.trim(ctx.request.body.name)  || '';

    if (psw !== repsw) {
        return await ctx.render('sign/reset', {name: name, key: key, error: '两次密码输入不一致。'});
    }

    let user = await UserProxy.getUserByNameAndKey(name, key);
    if (!user) {
        return await ctx.render('notify/notify', {error: '错误的激活链接。'});
    }

    let passhash       = await tools.bhash(psw);
    user.pass          = passhash;
    user.retrieve_key  = null;
    user.retrieve_time = null;
    user.active        = true; // 用户激活
    await user.save();

    await ctx.render('notify/notify', {success: '你的密码已重置。'});
    await next();
};
