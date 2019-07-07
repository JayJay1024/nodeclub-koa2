'use strict';

const validator = require('validator');
const UserProxy  = require('../../proxy').User;
const ReplyProxy = require('../../proxy').Reply;
const TopicProxy = require('../../proxy').Topic;
const at         = require('../../common/at');
const logger     = require('../../common/logger');
const message    = require('../../common/message');

/**
 * create a reply
 * @param {*} ctx 
 * @param {*} next 
 */
const create = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let topic_id = ctx.params.topic_id;
        let content  = ctx.request.body.content || '';
        let reply_id = ctx.request.body.reply_id;

        let str = validator.trim(content);
        if (str === '') {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: '回复内容不能为空'};
        }
        if (!validator.isMongoId(topic_id)) {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: '不是有效的话题id'};
        }

        let topic = await TopicProxy.getTopic(topic_id);
        if (!topic) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '话题不存在'};
        }
        if (topic.lock) {
            ctx.status = 403;
            return ctx.body = {success: false, error_msg: '该话题已被锁定'};
        }
        let topic_author = await UserProxy.getUserById(topic.author_id);

        let reply = await ReplyProxy.newAndSave(content, topic_id, ctx.user.id, reply_id);
        await TopicProxy.updateLastReply(topic_id, reply._id);

        // 发送at消息，并防止重复 at 作者
        let newContent = content.replace('@' + topic_author.loginname + ' ', '');
        await at.sendMessageToMentionUsers(newContent, topic_id, ctx.user.id, reply._id);

        let user = await UserProxy.getUserById(ctx.user.id);
        user.score += 5;
        user.reply_count += 1;
        await user.save();

        if (topic.author_id.toString() !== ctx.user.id.toString()) {
            await message.sendReplyMessage(topic.author_id, ctx.user.id, topic._id, reply._id);
        }

        ctx.body = {success: true, reply_id: reply._id};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.create = create;

/**
 * 点赞、取消点赞
 * @param {*} ctx 
 * @param {*} next 
 */
const ups = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let reply_id = ctx.params.reply_id;

        if (!validator.isMongoId(reply_id)) {
            ctx.status = 400;
            return ctx.body = {success: false, error_msg: '不是有效的评论id'};
        }

        let reply = await ReplyProxy.getReplyById(reply_id);
        if (!reply) {
            ctx.status = 404;
            return ctx.body = {success: false, error_msg: '评论不存在'};
        }
        if (reply.author_id.equals(ctx.user.id)) {
            ctx.status = 403;
            return ctx.body = {success: false, error_msg: '不能帮自己点赞'};
        }

        let action;
        reply.ups = reply.ups || [];
        let upIndex = reply.ups.indexOf(ctx.user.id);
        if (upIndex === -1) {
            reply.ups.push(ctx.user.id);
            action = 'up';
        } else {
            reply.ups.splice(upIndex, 1);
            action = 'down';
        }
        await reply.save();

        ctx.body = {success: true, action: action};
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.ups = ups;
