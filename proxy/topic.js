'use strict';


const at         = require('../common/at');
const UserProxy  = require('./user');
const ReplyProxy = require('./reply');
const TopicModel = require('../models').Topic;
const _          = require('lodash');

/**
 * 根据主题ID获取主题
 */
exports.getTopicById = async (id) => {
    let topic = await TopicModel.findOne({_id: id}).exec();
    if (topic) {
        let author = await UserProxy.getUserById(topic.author_id);
        if (author) {
            let last_reply = null;
            if (topic.last_reply) {
                last_reply = await ReplyProxy.getReplyById(topic.last_reply);
            }

            return {
                topic: topic,
                author: author,
                last_reply: last_reply,
            }
        }
    }
    return null;
};

/**
 * 获取关键词能搜索到的主题数量
 */
exports.getCountByQuery = (query) => {
    return TopicModel.countDocuments(query).exec();
};

/**
 * 根据关键字，获取主题列表
 */
exports.getTopicsByQuery = async (query, opt=null) => {
    query.deleted = false;
    let topics = await TopicModel.find(query, {}, opt).exec();
    for (let i = 0, l = topics.length; i < l; i++) {
        let reply = await ReplyProxy.getReplyById(topics[i].last_reply);
        let author = await UserProxy.getUserById(topics[i].author_id);

        // 作者可能已删除
        if (author) {
            topics[i].author = author;
            topics[i].reply = reply;
        } else {
            topics[i] = null;
        }
    }
    topics = _.compact(topics);
    return topics;
};

/**
 * for sitemap
 */
exports.getLimit5w = () => {
    return TopicModel.find({deleted: false}, '_id', {limit: 50000, sort: '-create_at'}).exec();
};

/**
 * 获取所有信息的话题
 */
exports.getFullTopic = async (id) => {
    let res = { status: 'something error.', };
    let topic = await TopicModel.findOne({_id: id, deleted: false}).exec();
    if (topic) {
        topic.linkedContent = await at.linkUsers(topic.content);
        let author = await UserProxy.getUserById(topic.author_id);
        if (author) {
            let replies = await ReplyProxy.getRepliesByTopicId(topic._id);

            res.topic   = topic;
            res.author  = author;
            res.replies = replies;
            res.status  = 'success';
        } else {
            res.status  = '话题的作者丢了。';
        }
    } else {
        res.status = '此话题不存在或已被删除。';
    }
    return res;
};

/**
 * 更新主题的最后回复信息
 */
exports.updateLastReply = async (topicId, replyId) => {
    let topic = await TopicModel.findOne({_id: topicId}).exec();
    if (topic) {
        topic.last_reply    = replyId;
        topic.last_reply_at = new Date();
        topic.reply_count   += 1;
        return topic.save();
    }
    return null;
};

/**
 * 根据主题ID，查找一条主题
 */
exports.getTopic = (id) => {
    return TopicModel.findOne({_id: id}).exec();
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 */
exports.reduceCount = async (id) => {
    let topic = TopicModel.findOne({_id: id}).exec();
    if (topic) {
        let reply = await ReplyProxy.getLastReplyByTopId(id);
        if (reply.length) {
            topic.last_reply = reply[0]._id;
        } else {
            topic.last_reply = null;
        }
        topic.reply_count -= 1;
        if (topic.reply_count < 0) {
            topic.reply_count = 0;
        }
        return topic.save();
    }
    return null;
};

exports.newAndSave = (title, content, tab, authorId) => {
    let topic       = new TopicModel();
    topic.title     = title;
    topic.content   = content;
    topic.tab       = tab;
    topic.author_id = authorId;
    return topic.save();
};
