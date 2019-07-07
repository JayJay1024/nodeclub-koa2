'use strict';

const MessageProxy = require('../../proxy').Message;
const at           = require('../../common/at');
const logger       = require('../../common/logger');
const renderHelper = require('../../common/render_helper');
const _            = require('lodash');

/**
 * 获取已读和未读消息
 * @param {*} ctx 
 * @param {*} next 
 */
const index = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let getLastMsg = async (srcMsg) => {
            let message_ready = [];

            for (let msg of srcMsg) {
                let _msg = await MessageProxy.getMessageById(msg._id);
                message_ready.push(_msg);
            }
            message_ready.filter(msg => {
                return !msg.is_invalid;
            });
            message_ready = message_ready.map(msg => {
                msg.author = _.pick(msg.author, ['loginname', 'avatar_url']);
                msg.topic  = _.pick(msg.topic, ['id', 'author', 'title', 'last_reply_at']);
                msg.reply  = _.pick(msg.reply, ['id', 'content', 'ups', 'create_at']);
                if (mdrender) {
                    msg.reply.content = renderHelper.markdown(at.linkUsers(msg.reply.content));
                }
                msg = _.pick(msg, ['id', 'type', 'has_read', 'author', 'topic', 'reply', 'create_at']);
                return msg;
            });
            return message_ready;
        };

        let user_id  = ctx.user.id;
        let mdrender = ctx.query.mdrender === 'false' ? false : true;

        let has_read = await MessageProxy.getReadMessagesByUserId(user_id);
        let unread   = await MessageProxy.getUnreadMessageByUserId(user_id);

        let has_read_messages    = await getLastMsg(has_read);
        let hasnot_read_messages = await getLastMsg(unread);

        ctx.body = {
            success: true,
            data: {
                has_read_messages: has_read_messages,
                hasnot_read_messages: hasnot_read_messages,
            },
        };
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.index = index;

/**
 * 标记所有未读消息为已读
 * @param {*} ctx 
 * @param {*} next 
 */
const markAll = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let unread = await MessageProxy.getUnreadMessageByUserId(ctx.user.id);

        for (let msg of unread) {
            msg.has_read = true;
            await msg.save();
        }

        unread.map(msg => {
            msg = _.pick(msg, ['id']);
            return msg;
        });

        ctx.body = {
            success: true,
            marked_msgs: unread
        };
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.markAll = markAll;

/**
 * 标记某条消息为已读
 * @param {*} ctx 
 * @param {*} next 
 */
const markOne = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let msg_id = ctx.params.msg_id;
        let marked_result = await MessageProxy.updateOneMessageToRead(msg_id);
        if (marked_result && marked_result.length) {
            ctx.body = {
                success: true,
                marked_msg_id: msg_id
            };
            return await next();
        }
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.markOne = markOne;

/**
 * 获取用户的消息数量
 * @param {*} ctx 
 * @param {*} next 
 */
const count = async (ctx, next) => {
    ctx.type = 'application/json';
    try {
        let count = await MessageProxy.getMessagesCount(ctx.user.id);
        ctx.body = {
            success: true,
            data: count
        };
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = {success: false, error_msg: '联系管理员'};
};
exports.count = count;
