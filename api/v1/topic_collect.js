'use strict';

const logger            = require('../../common/logger');
const UserProxy         = require('../../proxy').User;
const TopicProxy        = require('../../proxy').Topic
const TopicCollectProxy = require('../../proxy').TopicCollect
const _                 = require('lodash');
const validator         = require('validator');

/**
 * 列出收藏的话题
 * @param {*} ctx 
 * @param {*} next 
 */
const list = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let loginname = ctx.params.loginname;
        let user = await UserProxy.getUserByLoginName(loginname);
        if (!user) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '用户不存在'};
        }

        // api 返回 100 条就好了
        let collected_topics = await TopicCollectProxy.getTopicCollectsByUserId(user._id, {limit: 100});

        let ids = collected_topics.map((topic) => {
            return String(topic.topic_id);
        });
        let query = { _id: { $in: ids } };
        let topics = await TopicProxy.getTopicsByQuery(query, {});
        topics = _.sortBy(topics, (topic) => {
            return ids.indexOf(String(topic._id));
        });
        topics = topics.map((topic) => {
            topic.author = _.pick(topic.author, ['loginname', 'avatar_url']);
            return _.pick(topic, ['id', 'author_id', 'tab', 'content', 'title', 'last_reply_at', 'good', 'top', 'reply_count', 'visit_count', 'create_at', 'author']);
        });

        ctx.body = {success: true, data: topics};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.list = list;

/**
 * 收藏
 * @param {*} ctx 
 * @param {*} next 
 */
const collect = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let topic_id = ctx.request.body.topic_id;
        if (!validator.isMongoId(topic_id)) {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: '不是有效的话题id'};
        }

        let topic = await TopicProxy.getTopic(topic_id);
        if (!topic) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '话题不存在'};
        }

        let topic_collect = await TopicCollectProxy.getTopicCollect(ctx.user.id, topic._id);
        if (topic_collect) {
            return ctx.body = {success: false, error_msg: '已经收藏了'};
        }

        await TopicCollectProxy.newAndSave(ctx.user.id, topic._id);

        let user = await UserProxy.getUserById(ctx.user.id);
        user.collect_topic_count += 1;
        await user.save();

        topic.collect_count += 1;
        await topic.save();

        ctx.body = {success: true};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.collect = collect;

/**
 * 取消收藏
 * @param {*} ctx 
 * @param {*} next 
 */
const de_collect = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let topic_id = ctx.request.body.topic_id;
        if (!validator.isMongoId(topic_id)) {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: '不是有效的话题id'};
        }

        let topic = await TopicProxy.getTopic(topic_id);
        if (!topic) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '话题不存在'};
        }

        let remove_result = await TopicCollectProxy.remove(ctx.user.id, topic._id);
        if (remove_result.n === 0) {
            return ctx.body = {success: false};
        }

        let user = await UserProxy.getUserById(ctx.user.id);
        user.collect_topic_count -= 1;
        await user.save();

        topic.collect_count -= 1;
        await topic.save();

        ctx.body = {success: true};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.de_collect = de_collect;

