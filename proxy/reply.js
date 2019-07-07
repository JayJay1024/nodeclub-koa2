'use strict';

const at         = require('../common/at');
const UserProxy  = require('./user');
const ReplyModel = require('../models').Reply;

/**
 * 获取一条回复
 */
exports.getReply = (id) => {
    return ReplyModel.findOne({ _id: id }).exec();
};

/**
 * 根据回复ID，获取回复
 */
exports.getReplyById = async (id) => {
    let reply = await ReplyModel.findOne({ _id: id }).exec();
    if (reply) {
        let author = await UserProxy.getUserById(reply.author_id);
        reply.author = author;

        if (!reply.content_is_html) {
            reply.content = await at.linkUsers(reply.content);
        }
    }
    return reply;
};

/**
 * 根据话题ID，获取回复列表
 */
exports.getRepliesByTopicId = async (id) => {
    let replies = await ReplyModel.find({ topic_id: id, deleted: false }, '', { sort: 'create_at' }).exec();
    if (replies.length) {
        for (let i = 0, l = replies.length; i < l; i++) {
            let author = await UserProxy.getUserById(replies[i].author_id);
            replies[i].author = author || { _id: '' };
            
            if (!replies[i].content_is_html) {
                replies[i].content = await at.linkUsers(replies[i].content);
            }
        }
    }
    return replies;
};

/**
 * 创建并保存一条回复信息
 */

exports.newAndSave = (content, topicId, authorId, replyId) => {
    let reply       = new ReplyModel();
    reply.content   = content;
    reply.topic_id  = topicId;
    reply.author_id = authorId;
    if (replyId) {
        reply.reply_id = replyId;
    }
    return reply.save();
};

/**
 * 根据topicId查询到最新的一条回复的id
 */
exports.getLastReplyByTopId = (topicId) => {
    return ReplyModel.find({ topic_id: topicId, deleted: false }, '_id', { sort: { create_at : -1 }, limit : 1 }).exec();
};

exports.getRepliesByAuthorId = (authorId, opt = null) => {
    return ReplyModel.find({ author_id: authorId }, {}, opt).exec();
};

/**
 * 通过 author_id 获取回复总数
 */
exports.getCountByAuthorId = (authorId) => {
    return ReplyModel.countDocuments({ author_id: authorId }).exec();
};
