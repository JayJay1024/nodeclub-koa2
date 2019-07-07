'use strict';

const config       = require('../../config');
const logger       = require('../../common/logger');
const at           = require('../../common/at');
const renderHelper = require('../../common/render_helper');
const UserProxy    = require('../../proxy').User;
const TopicProxy   = require('../../proxy').Topic;
const TopicCollect = require('../../proxy').TopicCollect;
const UserModel    = require('../../models').User;
const TopicModel   = require('../../models').Topic;
const _            = require('lodash');
const validator    = require('validator');

/**
 * get topics
 * @param {*} ctx 
 * @param {*} next 
 */
const index = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let tab      = ctx.query.tab || 'all';
        let limit    = Number(ctx.query.limit) || config.list_topic_count;
        let mdrender = ctx.query.mdrender === 'false' ? false : true;
        let page     = parseInt(ctx.query.page, 10) || 1;
        page         = page > 0 ? page : 1;

        let query = {};
        if (!tab || tab === 'all') {
            query.tab = {$nin: ['job', 'dev']};  // 不包括
        } else {
            if (tab === 'good') {
                query.good = true;
            } else {
                query.tab = tab;
            }
        }
        query.deleted = false;
        let options = { skip: (page - 1) * limit, limit: limit, sort: '-top -last_reply_at'};

        let topics = await TopicModel.find(query, '', options);
        for (let topic of topics) {
            let author = await UserModel.findById(topic.author_id);
            if (mdrender) {
                topic.content = renderHelper.markdown(at.linkUsers(topic.content));
                topic.author  = _.pick(author, ['loginname', 'avatar_url']);
            }
        }
        topics = topics.map((topic) => {
            return _.pick(topic, ['id', 'author_id', 'tab', 'content', 'title', 'last_reply_at', 'good', 'top', 'reply_count', 'visit_count', 'create_at', 'author']);
        });

        ctx.body = {success: true, data: topics};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.index = index;


/**
 * 
 * @param {*} ctx 
 * @param {*} next 
 */
const show = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let topic_id = String(ctx.params.id);
        let mdrender = ctx.query.mdrender === 'false' ? false : true;
      
        if (!validator.isMongoId(topic_id)) {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: '不是有效的话题id'};
        }

        let full = await TopicProxy.getFullTopic(topic_id);
        if (full.status !== 'success') {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: full.status};
        }
        let {topic, author, replies} = full;

        topic.visit_count += 1;
        await topic.save();

        topic = _.pick(topic, ['id', 'author_id', 'tab', 'content', 'title', 'last_reply_at', 'good', 'top', 'reply_count', 'visit_count', 'create_at', 'author']);
        if (mdrender) {
            topic.content = renderHelper.markdown(at.linkUsers(topic.content));
        }
        topic.author = _.pick(author, ['loginname', 'avatar_url']);
        topic.replies = replies.map(reply => {
            if (mdrender) {
                reply.content = renderHelper.markdown(at.linkUsers(reply.content));
            }
            reply.author   = _.pick(reply.author, ['loginname', 'avatar_url']);
            reply          = _.pick(reply, ['id', 'author', 'content', 'ups', 'create_at', 'reply_id']);
            reply.reply_id = reply.reply_id || null;
        
            if (reply.ups && ctx.user && reply.ups.indexOf(ctx.user.id) !== -1) {
                reply.is_uped = true;
            } else {
                reply.is_uped = false;
            }
        
            return reply;
        });

        let is_collect = null;
        if (ctx.user) {
            is_collect = await TopicCollect.getTopicCollect(ctx.user.id, topic_id);
        }
        topic.is_collect = !!is_collect;

        ctx.body = {success: true, data: topic};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.show = show;


/**
 * 创建 topic
 * @param {*} ctx 
 * @param {*} next 
 */
const create = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let tab     = validator.trim(ctx.request.body.tab || '');
        let title   = validator.trim(ctx.request.body.title || '');
        let content = validator.trim(ctx.request.body.content || '');

        // 得到所有的 tab, e.g. ['ask', 'share', ..]
        let allTabs = config.tabs.map((tp) => {
            return tp[0];
        });

        // 验证
        let editError;
        if (title === '') {
            editError = '标题不能为空';
        } else if (title.length < 5 || title.length > 100) {
            editError = '标题字数太多或太少';
        } else if (!tab || !_.includes(allTabs, tab)) {
            editError = '必须选择一个版块';
        } else if (content === '') {
            editError = '内容不可为空';
        }

        if (editError) {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: editError};
        }

        // save score
        let user = await UserProxy.getUserById(ctx.user.id);
        user.score += 5;
        user.topic_count += 1;
        await user.save();
        ctx.user = user;

        let topic = await TopicProxy.newAndSave(title, content, tab, ctx.user.id);

        // 发送 at 消息
        await at.sendMessageToMentionUsers(content, topic.id, ctx.user.id);

        ctx.body = {success: true, topic_id: topic.id};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.create = create;


/**
 * 更新 topic
 * @param {*} ctx 
 * @param {*} next 
 */
const update = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let tab      = _.trim(ctx.request.body.tab);
        let title    = _.trim(ctx.request.body.title);
        let content  = _.trim(ctx.request.body.content);
        let topic_id = _.trim(ctx.request.body.topic_id);

        // 得到所有的 tab, e.g. ['ask', 'share', ..]
        let allTabs = config.tabs.map((tp) => {
            return tp[0];
        });

        let topicOrig = await TopicProxy.getTopicById(topic_id);
        if (!topicOrig) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '此话题不存在或已被删除。'};
        }
        let topic = topicOrig.topic;

        if (topic.author_id.equals(ctx.user._id) || req.user.is_admin) {
            // 验证
            let editError;
            if (title === '') {
                editError = '标题不能是空的。';
            } else if (title.length < 5 || title.length > 100) {
                editError = '标题字数太多或太少。';
            } else if (!tab || !_.includes(allTabs, tab)) {
                editError = '必须选择一个版块。';
            }

            if (editError) {
                return ctx.body = {success: false, error_msg: editError};
            }

            //保存话题
            topic.tab       = tab;
            topic.title     = title;
            topic.content   = content;
            topic.update_at = new Date();
            await topic.save();

            //发送 at 消息
            await at.sendMessageToMentionUsers(content, topic._id, ctx.user._id);

            ctx.body = {success: true, topic_id: topic.id};
            return await next();
        } else {
            ctx.status = 403;
            return ctx.body = {success: false, error_msg: '对不起，你不能编辑此话题。'};
        }
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.update = update;
