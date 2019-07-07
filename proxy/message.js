'use strict';

const UserProxy    = require('./user');
const TopicProxy   = require('./topic');
const ReplyProxy   = require('./reply');
const MessageModel = require('../models/').Message;

/**
 * 根据用户ID，获取未读消息的数量
 */
exports.getMessagesCount = (id) => {
    return MessageModel.countDocuments({ master_id: id, has_read: false }).exec();
};

const getMessageRelations = async (message) => {
    if (message.type === 'reply' || message.type === 'reply2' || message.type === 'at') {
        let author = await UserProxy.getUserById(message.author_id);
        let topic  = await TopicProxy.getTopicById(message.topic_id);
        let reply  = await ReplyProxy.getReplyById(message.reply_id);

        message.author = author;
        message.topic  = topic;
        message.reply  = reply;

        if (!author || !topic) {
            Relations.is_invalid = true;
        }
        return message;
    }
    return {is_invalid: true};
};
exports.getMessageRelations = getMessageRelations;

/**
 * 根据消息Id获取相关消息
 */
exports.getMessageById = async (id) => {
    let message = await MessageModel.findOne({ _id: id }).exec();
    return getMessageRelations(message);
};

/**
 * 根据用户ID，获取已读消息列表
 */
exports.getReadMessagesByUserId = (userId) => {
    return MessageModel.find({ master_id: userId, has_read: true }, null, { sort: '-create_at', limit: 20 }).exec();
};

/**
 * 根据用户ID，获取未读消息列表
 */
exports.getUnreadMessageByUserId = (userId) => {
    return MessageModel.find({ master_id: userId, has_read: false }, null, { sort: '-create_at' }).exec();
};

/**
 * 将一组消息设置成已读
 */
exports.updateMessagesToRead = (userId, messages) => {
    if (messages.length) {
        let ids = messages.map(m => {
            return m.id;
        });
        let query = { master_id: userId, _id: { $in: ids }};
        return MessageModel.updateMany(query, { $set: {has_read: true} }).exec();
    }
    return [];
};

/**
 * 将单个消息设置成已读
 */
exports.updateOneMessageToRead = (msgId) => {
    if (msgId) {
        let query = { _id: msgId };
        return MessageModel.updateMany(query, { $set: { has_read: true }}).exec();
    }
    return null;
};
