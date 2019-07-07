'use strict';

const at          = require('../common/at');
const logger      = require('../common/logger');
const message     = require('../common/message');
const UserProxy   = require('../proxy').User;
const TopicProxy  = require('../proxy').Topic;
const ReplyProxy  = require('../proxy').Reply;
const validator   = require('validator');

/**
 * 添加回复
 */
exports.add = async (ctx, next) => {
    let topic_id = ctx.params.topic_id;
    let content  = ctx.request.body.r_content;
    let reply_id = ctx.request.body.reply_id;

    let str = validator.trim(String(content));
    if (str === '') {
        return await ctx.renderError('回复内容不能为空!', 422);
    }

    // get topic and check
    let topic = await TopicProxy.getTopic(topic_id);
    if (!topic) {
        return await ctx.renderError('主题已被删除或不存在', 404);
    }
    if (topic.lock) {
        return await ctx.renderError('此主题已被锁定，不能回复。', 403);
    }

    let topic_author = await UserProxy.getUserById(topic.author_id);  // topic_author
    let reply = await ReplyProxy.newAndSave(content, topic_id, ctx.session.user._id, reply_id);  // new a reply

    // update topic's reply
    await TopicProxy.updateLastReply(topic_id, reply._id);

    // update user's data
    let user = await UserProxy.getUserById(ctx.session.user._id);
    user.score += 5;
    user.reply_count += 1;
    await user.save();
    ctx.session.user = user;

    let newContent = content.replace('@' + topic_author.loginname + ' ', '');
    await at.sendMessageToMentionUsers(newContent, topic_id, ctx.session.user._id, reply._id);

    if (topic.author_id.toString() !== ctx.session.user._id.toString()) {
        await message.sendReplyMessage(topic.author_id, ctx.session.user._id, topic._id, reply._id);
    }

    await ctx.redirect('/topic/' + topic_id + '#' + reply._id);
    return await next();
};

/**
 * 删除回复信息
 */
exports.delete = async (ctx, next) => {
    try {
        let reply_id = ctx.request.body.reply_id;

        // get reply and check
        let reply = await ReplyProxy.getReplyById(reply_id);
        if (!reply) {
            ctx.status = 422;
            ctx.type = 'application/json';
            return ctx.body = {status: 'no reply ' + reply_id + ' exists'};
        }

        if (reply.author_id.toString() === ctx.session.user._id.toString() || ctx.session.user.is_admin) {
            reply.deleted = true;  // 标记一下，所以并不是真的删
            await reply.save();

            reply.author.score -= 5;
            reply.author.reply_count -= 1;
            await reply.author.save();

            ctx.type = 'application/json';
            ctx.body = {status: 'success'};
            return await next();
        } else {
            ctx.type = 'application/json';
            return ctx.body = {status: 'failed'};
        }
    } catch (err) {
        logger.error(err);
    }

    ctx.type = 'application/json';
    ctx.body = {status: 'something error.'};
};

/**
 * 打开回复编辑器
 */
exports.showEdit = async (ctx, next) => {
    let reply_id = ctx.params.reply_id;

    let reply = await ReplyProxy.getReplyById(reply_id);
    if (!reply) {
        return await ctx.render404('此回复不存在或已被删除。');
    }

    if (ctx.session.user._id.equals(reply.author_id) || ctx.session.user.is_admin) {  // 作者或者管理员
        await ctx.render('reply/edit', {
            reply_id: reply._id,
            content: reply.content
        });
        return await next();
    } else {
        return await ctx.renderError('对不起，你不能编辑此回复。', 403);
    }
};

/**
 * 提交编辑回复
 */
exports.update = async (ctx, next) => {
    let reply_id = ctx.params.reply_id;
    let content  = ctx.request.body.t_content;

    let reply = await ReplyProxy.getReplyById(reply_id);
    if (!reply) {
        return await ctx.render404('此回复不存在或已被删除。');
    }

    if (String(reply.author_id) === req.session.user._id.toString() || req.session.user.is_admin) {
        if (content.trim().length) {
            reply.content = content;
            reply.update_at = new Date();
            await reply.save();
            await ctx.redirect('/topic/' + reply.topic_id + '#' + reply._id);
            return await next();
        } else {
            return await ctx.renderError('回复的字数太少。', 400);
        }
    } else {
        return await ctx.renderError('对不起，你不能编辑此回复。', 403);
    }
};

/**
 * 点赞
 */
exports.up = async (ctx, next) => {
    try {
        let reply_id = ctx.params.reply_id;
        let user_id  = ctx.session.user._id;

        let reply = await ReplyProxy.getReplyById(reply_id);
        if (reply.author_id.equals(user_id)) {
            ctx.type = 'application/json';
            return ctx.body = {success: false, message: '呵呵，不能帮自己点赞。'};
        } else {
            let action;
            reply.ups = reply.ups || [];
            let upIndex = reply.ups.indexOf(user_id);
            if (upIndex === -1) {
                reply.ups.push(user_id);
                action = 'up';
            } else {
                reply.ups.splice(upIndex, 1);
                action = 'down';
            }
            await reply.save();

            ctx.type = 'application/json';
            ctx.body = {success: true, action: action};
            return await next();
        }
    } catch (err) {
        logger.error(err);
    }

    ctx.type = 'application/json';
    ctx.body = {success: false, message: '联系管理员。'};
};
