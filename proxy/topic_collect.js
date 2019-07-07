'use strict';

const TopicCollectModel = require('../models').TopicCollect;
const _                 = require('lodash');

exports.getTopicCollect = (userId, topicId) => {
    return TopicCollectModel.findOne({user_id: userId, topic_id: topicId}).exec();
};

exports.getTopicCollectsByUserId = (userId, opt=null) => {
    opt = _.assign({sort: '-create_at'}, opt);
    return TopicCollectModel.find({user_id: userId}, '', opt).exec();
};

exports.newAndSave = (userId, topicId) => {
    let topic_collect      = new TopicCollectModel();
    topic_collect.user_id  = userId;
    topic_collect.topic_id = topicId;
    return topic_collect.save();
};

exports.remove = (userId, topicId) => {
    return TopicCollectModel.deleteOne({user_id: userId, topic_id: topicId}).exec();
};
