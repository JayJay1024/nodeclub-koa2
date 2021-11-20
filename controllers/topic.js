'use strict';

const config            = require('../config');
const _                 = require('lodash');
const validator         = require('validator');

const at                = require('../common/at');
const store             = require('../common/store');
const cache             = require('../common/cache');
const logger            = require('../common/logger');

const UserProxy         = require('../proxy').User;
const TopicProxy        = require('../proxy').Topic;
const TopicCollectProxy = require('../proxy').TopicCollect;

exports.index = async (ctx, next) => {
    let isUped = (user, reply) => {
        if (!reply.ups) { return false; }
        return reply.ups.indexOf(user._id) !== -1;
    };

    let topic_id    = ctx.params.tid;
    let currentUser = ctx.session.user;

    if (topic_id.length !== 24) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    // topic
    let full = await TopicProxy.getFullTopic(topic_id);  // will return {status、topic、author、replies}
    if (full.status !== 'success') {
        return await ctx.renderError(full.status);
    }
    let {topic, author, replies} = full;

    topic.visit_count += 1;
    await topic.save();

    topic.author  = author;
    topic.replies = replies;

    let allUpCount = replies.map((reply) => {
        return reply.ups && reply.ups.length || 0;
    });
    allUpCount = _.sortBy(allUpCount, Number).reverse();

    let threshold = allUpCount[2] || 0;  // 点赞数排名第三的回答，它的点赞数就是阈值
    if (threshold < 3) {
        threshold = 3;
    }
    topic.reply_up_threshold = threshold;

    // other_topics
    let options = { limit: 5, sort: '-last_reply_at' };
    let query   = { author_id: topic.author_id, _id: { $nin: [ topic._id ] } };
    let other_topics = await TopicProxy.getTopicsByQuery(query, options);

    // no_reply_topics
    let no_reply_topics = await cache.get('no_reply_topics');
    if (!no_reply_topics) {
        no_reply_topics = await TopicProxy.getTopicsByQuery(
            { reply_count: 0, tab: {$nin: ['job', 'dev']} },
            { limit: 5, sort: '-create_at' }
        );
        await cache.set('no_reply_topics', no_reply_topics, 60 * 1);
    }

    // is_collect
    let is_collect = null;
    if (currentUser) {
        is_collect = await TopicCollectProxy.getTopicCollect(currentUser._id, topic_id);
    }

    await ctx.render('topic/index', {
        topic: topic,
        author_other_topics: other_topics,
        no_reply_topics: no_reply_topics,
        is_uped: isUped,
        is_collect: is_collect,
    });
    await next();
};

exports.create = async (ctx, next) => {
    return ctx.render('topic/edit', {tabs: config.tabs});
};

exports.put = async (ctx, next) => {
    let tab     = validator.trim(ctx.request.body.tab);
    let title   = validator.trim(ctx.request.body.title);
    let content = validator.trim(ctx.request.body.t_content);

    // 得到所有的 tab, e.g. ['ask', 'share', ..]
    let allTabs = config.tabs.map((tp) => {
        return tp[0];
    });

    // 验证
    let editError;
    if (title === '') {
        editError = '标题不能是空的。';
    } else if (title.length < 5 || title.length > 100) {
        editError = '标题字数太多或太少。';
    } else if (!tab || allTabs.indexOf(tab) === -1) {
        editError = '必须选择一个版块。';
    } else if (content === '') {
        editError = '内容不可为空';
    }

    if (editError) {
        ctx.status = 422;
        return await ctx.render('topic/edit', {
            edit_error: editError,
            title: title,
            content: content,
            tabs: config.tabs
        });
    }

    let user = await UserProxy.getUserById(ctx.session.user._id);
    user.score += 5;
    user.topic_count += 1;
    await user.save();

    let topic = await TopicProxy.newAndSave(title, content, tab, ctx.session.user._id);
    await at.sendMessageToMentionUsers(content, topic._id, ctx.session.user._id);

    await ctx.redirect('/topic/' + topic._id);
    await next();
};

exports.showEdit = async (ctx, next) => {
    let topic_id = ctx.params.tid;

    let tmp = await TopicProxy.getTopicById(topic_id);
    if (!tmp) {
        return await ctx.render404('此话题不存在或已被删除。');
    }
    let {topic} = tmp;

    if (String(topic.author_id) === String(ctx.session.user._id) || ctx.session.user.is_admin) {
        await ctx.render('topic/edit', {
            action: 'edit',
            topic_id: topic._id,
            title: topic.title,
            content: topic.content,
            tab: topic.tab,
            tabs: config.tabs
        });
        await next();
    } else {
        await ctx.renderError('对不起，你不能编辑此话题。', 403);
    }
};

exports.update = async (ctx, next) => {
    let topic_id = ctx.params.tid;
    let tab      = ctx.request.body.tab;
    let title    = ctx.request.body.title;
    let content  = ctx.request.body.t_content;

    let tmp = await TopicProxy.getTopicById(topic_id);
    if (!tmp) {
        return await ctx.render404('此话题不存在或已被删除。');
    }
    let {topic} = tmp;

    if (topic.author_id.equals(ctx.session.user._id) || ctx.session.user.is_admin) {
        tab     = validator.trim(tab);
        title   = validator.trim(title);
        content = validator.trim(content);

        // 验证
        var editError;
        if (title === '') {
            editError = '标题不能是空的。';
        } else if (title.length < 5 || title.length > 100) {
            editError = '标题字数太多或太少。';
        } else if (!tab) {
            editError = '必须选择一个版块。';
        }

        if (editError) {
            return await ctx.render('topic/edit', {
                action: 'edit',
                edit_error: editError,
                topic_id: topic._id,
                content: content,
                tabs: config.tabs
            });
        }

        //保存话题
        topic.title     = title;
        topic.content   = content;
        topic.tab       = tab;
        topic.update_at = new Date();
        await topic.save();

        //发送at消息
        await at.sendMessageToMentionUsers(content, topic._id, ctx.session.user._id);

        await ctx.redirect('/topic/' + topic._id);
        await next();
    } else {
        await ctx.renderError('对不起，你不能编辑此话题。', 403);
    }
};

exports.delete = async (ctx, next) => {
    // 删除话题，话题作者topic_count减1
    // 删除回复，回复作者reply_count减1
    // 删除topic_collect，用户collect_topic_count减1
    try {
        let topic_id = ctx.params.tid;

        let full = await TopicProxy.getFullTopic(topic_id);
        if (full.status !== 'success') {
            ctx.status = 403;
            ctx.type = 'application/json';
            return ctx.body = {success: false, message: full.status};
        }
        let {topic, author, replies} = full;

        if (!ctx.session.user.is_admin && !(topic.author_id.equals(ctx.session.user._id))) {
            ctx.status = 403;
            ctx.type = 'application/json';
            return ctx.body = {success: false, message: '无权限。'};
        }

        author.score -= 5;
        author.topic_count -= 1;
        await author.save();

        topic.deleted = true;
        await topic.save();

        ctx.type = 'application/json';
        ctx.body = {success: true, message: '话题已被删除。'};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.type = 'application/json';
    ctx.body = {success: false, message: 'something error.'};
};

/**
 * 置顶
 */
exports.top = async (ctx, next) => {
    let topic_id = ctx.params.tid;
    let referer  = ctx.get('referer');

    if (topic_id.length !== 24) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    let topic = await TopicProxy.getTopic(topic_id);
    if (!topic) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    topic.top = !topic.top;
    await topic.save();

    let msg = topic.top ? '此话题已置顶。' : '此话题已取消置顶。';
    await ctx.render('notify/notify', {success: msg, referer: referer});
    await next();
};

/**
 * 设为精华
 */
exports.good = async (ctx, next) => {
    let topic_id = ctx.params.tid;
    let referer = ctx.get('referer');

    if (topic_id.length !== 24) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    let topic = await TopicProxy.getTopic(topic_id);
    if (!topic) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    topic.good = !topic.good;
    await topic.save();

    let msg = topic.good ? '此话题已加精。' : '此话题已取消加精。';
    await ctx.render('notify/notify', {success: msg, referer: referer});
    await next();
};

/**
 * 锁定主题，不可再回复
 */
exports.lock = async (ctx, next) => {
    let topic_id = ctx.params.tid;
    let referer = ctx.get('referer');

    if (topic_id.length !== 24) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    let topic = await TopicProxy.getTopic(topic_id);
    if (!topic) {
        return await ctx.render404('此话题不存在或已被删除。');
    }

    topic.lock = !topic.lock;
    await topic.save();

    let msg = topic.lock ? '此话题已锁定。' : '此话题已取消锁定。';
    await ctx.render('notify/notify', {success: msg, referer: referer});
    await next();
};

/**
 * 收藏主题
 */
exports.collect = async (ctx, next) => {
    try {
        let topic_id = ctx.request.body.topic_id;

        if (topic_id.length !== 24) {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }

        let topic = await TopicProxy.getTopic(topic_id);
        if (!topic) {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }

        let topicCollect = await TopicCollectProxy.getTopicCollect(ctx.session.user._id, topic._id);
        if (topicCollect) {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }
        await TopicCollectProxy.newAndSave(ctx.session.user._id, topic._id);

        let user = await UserProxy.getUserById(ctx.session.user._id);
        user.collect_topic_count += 1;
        await user.save();

        ctx.session.user.collect_topic_count += 1;
        topic.collect_count += 1;
        await topic.save();

        ctx.type = 'application/json';
        ctx.body = {status: 'success'};
        return await next();
    } catch (err) {
        logger.error(err);
    }

    ctx.type = 'application/json';
    ctx.body = {status: 'failed'};
};

/**
 * 取消收藏
 */
exports.de_collect = async (ctx, next) => {
    try {
        let topic_id = ctx.request.body.topic_id;

        if (topic_id.length !== 24) {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }

        let topic = await TopicProxy.getTopic(topic_id);
        if (!topic) {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }

        let removeResult = await TopicCollectProxy.remove(ctx.session.user._id, topic._id);
        if (removeResult.n == 0) {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }

        let user = await UserProxy.getUserById(ctx.session.user._id);
        user.collect_topic_count -= 1;
        ctx.session.user = user;
        await user.save();

        topic.collect_count -= 1;
        await topic.save();

        ctx.type = 'application/json';
        ctx.body = {status: 'success'};
        return await next();
    } catch (err) {
        logger.error(err);
    }

    ctx.type = 'application/json';
    ctx.body = {status: 'failed'};
};

/**
 * upload
 */
exports.upload = async (ctx, next) => {
    try {
        let url;
        let keys = Object.keys(ctx.request.files);
        for (let key of keys) {
            url = store.upload(ctx.request.files[key]);
            break;
        }
        ctx.type = 'application/json';
        ctx.body = {status: true, url: url};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.type = 'application/json';
    ctx.body = {status: false, msg: 'something error.'};
};
