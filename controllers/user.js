'use strict';

const TopicModel        = require('../models').Topic;
const ReplyModel        = require('../models').Reply;

const UserProxy         = require('../proxy').User;
const TopicProxy        = require('../proxy').Topic;
const ReplyProxy        = require('../proxy').Reply;
const TopicCollectProxy = require('../proxy').TopicCollect;

const config            = require('../config');
const tools             = require('../common/tools');
const logger            = require('../common/logger');
const _                 = require('lodash');
const util              = require('util');
const validator         = require('validator');
const uuid              = require('node-uuid');

exports.index = async (ctx, next) => {
    // user
    let user_name = ctx.params.name;
    let user = await UserProxy.getUserByLoginName(user_name);
    if (!user) {
        return await ctx.render404('这个用户不存在。');
    }
    if (user.url && user.url.indexOf('http') !== 0) {
        user.url = 'http://' + user.url;
    }

    // recent topics
    let query         = { author_id: user._id };
    let opt           = { limit: 5, sort: '-create_at' };
    let recent_topics = await TopicProxy.getTopicsByQuery(query, opt);

    // recent replies
    let replies = await ReplyProxy.getRepliesByAuthorId(user._id, { limit: 20, sort: '-create_at' });
    let topic_ids = replies.map((reply) => {
        return reply.topic_id.toString();
    });
    topic_ids = _.uniq(topic_ids).slice(0, 5);  // 只显示最近5条
    query = {_id: {'$in': topic_ids}};
    opt = {};
    let recent_replies = await TopicProxy.getTopicsByQuery(query, opt);
    recent_replies = _.sortBy(recent_replies, (topic) => {
        return topic_ids.indexOf(topic._id.toString());
    });

    // 如果用户没有激活，那么管理员可以帮忙激活
    let token = '';
    if (!user.active && ctx.session.user && ctx.session.user.is_admin) {
        token = utility.md5(user.email + user.pass + config.session_secret);
    }

    await ctx.render('user/index', {
        user: user,
        recent_topics: recent_topics,
        recent_replies: recent_replies,
        token: token,
        pageTitle: util.format('@%s 的个人主页', user.loginname),
    });
    await next();
}

exports.showSetting = async (ctx, next) => {
    let user = await UserProxy.getUserById(ctx.session.user._id, true);
    if (ctx.query.save === 'success') {
        user.success = '保存成功。';
    }
    user.error = null;
    await ctx.render('user/setting', user);
    await next();
};

exports.setting = async (ctx, next) => {
    let action = ctx.request.body.action;
    let showMessage = (msg, data, isSuccess) => {
        data = data || ctx.request.body;
        let data2 = {
            loginname: data.loginname,
            email: data.email,
            url: data.url,
            location: data.location,
            signature: data.signature,
            weibo: data.weibo,
            accessToken: data.accessToken,
        };
        if (isSuccess) {
            data2.success = msg;
        } else {
            data2.error = msg;
        }
        ctx.render('user/setting', data2);
    };

    // 保存设置
    if (action === 'change_setting') {
        let url       = validator.trim(ctx.request.body.url);
        let location  = validator.trim(ctx.request.body.location);
        let weibo     = validator.trim(ctx.request.body.weibo);
        let signature = validator.trim(ctx.request.body.signature);

        let user = await UserProxy.getUserById(ctx.session.user._id);
        user.url       = url;
        user.location  = location;
        user.signature = signature;
        user.weibo     = weibo;
        await user.save();

        ctx.session.user = user.toObject({virtual: true});
        await ctx.redirect('/setting?save=success');
        return await next();
    }

    // 更改密码
    if (action === 'change_password') {
        let old_pass = validator.trim(ctx.request.body.old_pass);
        let new_pass = validator.trim(ctx.request.body.new_pass);
        if (!old_pass || !new_pass) {
            return await ctx.render('notify/notify', {error: '旧密码或新密码不得为空。'});
        }

        let user = await UserProxy.getUserById(ctx.session.user._id);
        let bool = await tools.bcompare(old_pass, user.pass);
        if (!bool) {
            return await showMessage('当前密码不正确。', user);
        }

        let passhash = await tools.bhash(new_pass);
        user.pass = passhash;
        await user.save();

        await showMessage('密码已被修改。', user, true);
        return await next();
    }
};

exports.top100 = async (ctx, next) => {
    let opt = {limit: 100, sort: '-score'};
    let tops = await UserProxy.getUsersByQuery({is_block: false}, opt);
    await ctx.render('user/top100', {
        users: tops,
        pageTitle: 'Top100',
    });
    await next();
};

exports.listStars = async (ctx, next) => {
    let stars = UserProxy.getUsersByQuery({is_star: true}, {});
    await ctx.render('user/stars', {stars: stars});
    await next();
};

exports.listCollectedTopics = async (ctx, next) => {
    let name = ctx.params.name;
    let page = Number(ctx.query.page) || 1;
    let limit = config.list_topic_count;

    let user = await UserProxy.getUserByLoginName(name);
    if (user) {
        let opt = {
            skip: (page - 1) * limit,
            limit: limit,
        };
        let collects = await TopicCollectProxy.getTopicCollectsByUserId(user._id, opt);
        let ids = collects.map((collect) => {
            return String(collect.topic_id);
        });

        let query = {_id: {$in: ids}};
        let topics = await TopicProxy.getTopicsByQuery(query, {});
        topics = _.sortBy(topics, (topic) => {
            return ids.indexOf(String(topic._id));
        });

        let pages = Math.ceil(user.collect_topic_count / limit);
        await ctx.render('user/collect_topics', {
            topics: topics,
            current_page: page,
            pages: pages,
            user: user
        });
        return await next();
    }
    await ctx.render('notify/notify', {error: '用户不存在。'});
};

exports.listTopics = async (ctx, next) => {
    let user_name = ctx.params.name;
    let limit     = config.list_topic_count;

    // page
    let page      = Number(ctx.query.page) || 1;

    // user
    let user = await UserProxy.getUserByLoginName(user_name);
    if (!user) {
        return await ctx.render404('这个用户不存在。');
    }

    // topics
    let query = {'author_id': user._id};
    let opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    let topics = await TopicProxy.getTopicsByQuery(query, opt);

    // pages
    let all_topics_count = await TopicProxy.getCountByQuery(query);
    let pages = Math.ceil(all_topics_count / limit);

    await ctx.render('user/topics', {
        user: user,
        topics: topics,
        current_page: page,
        pages: pages
    });
    await next();
};

exports.listReplies = async (ctx, next) => {
    let limit     = 50;
    let user_name = ctx.params.name;

    // page
    let page      = Number(ctx.query.page) || 1;

    // user
    let user = await UserProxy.getUserByLoginName(user_name);
    if (!user) {
        return await ctx.render404('这个用户不存在。');
    }

    let opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    let replies = await ReplyProxy.getRepliesByAuthorId(user._id, opt);
    let topic_ids = replies.map((reply) => {
        return reply.topic_id.toString();
    });
    topic_ids = _.uniq(topic_ids);

    // topics
    let query = {'_id': {'$in': topic_ids}};
    let topics = await TopicProxy.getTopicsByQuery(query, {});
    topics = _.sortBy(topics, (topic) => {
        return topic_ids.indexOf(topic._id.toString());
    });

    // pages
    let count = await ReplyProxy.getCountByAuthorId(user._id);
    let pages = Math.ceil(count / limit);

    await ctx.render('user/replies', {
        user: user,
        topics: topics,
        current_page: page,
        pages: pages
    });
    await next();
};

exports.toggleStar = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let user_id = ctx.request.body.user_id;
        let user = await UserProxy.getUserById(user_id);
        if (!user) {
            return ctx.body = {status: '用户不存在'};
        }

        user.is_star = !user.is_star;
        await user.save();

        ctx.body = {status: 'success'};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {status: '联系管理员'};
};

exports.block = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let loginname = ctx.params.name;
        let action    = ctx.request.body.action;

        let user = await UserProxy.getUserByLoginName(loginname);
        if (!user) {
            return ctx.body = {status: '用户不存在'};
        }

        if (action === 'set_block') {
            user.is_block = true;
        } else if (action === 'cancel_block') {
            user.is_block = false;
        }
        await user.save();

        ctx.body = {status: 'success'};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {status: '联系管理员'};
};

exports.deleteAll = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let loginname = ctx.params.name;
        let user = await UserProxy.getUserByLoginName(loginname);
        if (!user) {
            return ctx.body = {status: '用户不存在'};
        }

        // 删除主题
        await TopicModel.updateMany({author_id: user._id}, {$set: {deleted: true}});
        // 删除评论
        await ReplyModel.updateMany({author_id: user._id}, {$set: {deleted: true}});
        // 点赞数也全部干掉
        await ReplyModel.updateMany({}, {$pull: {ups: user._id}});

        ctx.body = {status: 'success'};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {status: '联系管理员'};
};

exports.refreshToken = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let user_id = ctx.session.user._id;
        let user = await UserProxy.getUserById(user_id);
        if (!user) {
            return ctx.body = {status: '用户不存在'};
        }

        user.accessToken = uuid.v4();
        await user.save();

        ctx.body = {status: 'success', accessToken: user.accessToken};
        return await next();
    } catch (err) {
        logger.debug(err);
    }
    ctx.body = {status: '联系管理员'};
};
