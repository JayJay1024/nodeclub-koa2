'use strict';

const logger     = require('../../common/logger');
const UserProxy  = require('../../proxy').User;
const TopicProxy = require('../../proxy').Topic;
const ReplyProxy = require('../../proxy').Reply;
const _          = require('lodash');

/**
 * 
 * @param {*} ctx 
 * @param {*} next 
 */
const show = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let loginname = ctx.params.loginname;
        let user = await UserProxy.getUserByLoginName(loginname);
        if (!user) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '用户不存在'};
        }

        // recent_topics
        let query = {author_id: user._id};
        let opt = {limit: 15, sort: '-create_at'};
        let recent_topics = await TopicProxy.getTopicsByQuery(query, opt);

        let replies = await ReplyProxy.getRepliesByAuthorId(user._id, {limit: 20, sort: '-create_at'});
        let topic_ids = replies.map((reply) => {
            return reply.topic_id.toString();
        });
        topic_ids = _.uniq(topic_ids).slice(0, 5);  // 只显示最近5条

        // recent_replies
        let recent_replies = await TopicProxy.getTopicsByQuery({_id: {$in: topic_ids}}, {});
        recent_replies = _.sortBy(recent_replies, (topic) => {
            return topic_ids.indexOf(topic._id.toString());
        });

        user = _.pick(user, ['loginname', 'avatar_url', 'githubUsername', 'create_at', 'score']);
        user.recent_topics = recent_topics.map((topic) => {
            topic.author = _.pick(topic.author, ['loginname', 'avatar_url']);
            topic        = _.pick(topic, ['id', 'author', 'title', 'last_reply_at']);
            return topic;
        });
        user.recent_replies = recent_replies.map((topic) => {
            topic.author = _.pick(topic.author, ['loginname', 'avatar_url']);
            topic        = _.pick(topic, ['id', 'author', 'title', 'last_reply_at']);
            return topic;
        });

        ctx.body = {success: true, data: user};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.show = show;
