'use strict';

const MessageModel  = require('../models').Message;

const sendMessage = (master_id, author_id, topic_id, reply_id, msg_type='reply') => {
    let message       = new MessageModel();
    message.type      = msg_type;
    message.master_id = master_id;
    message.author_id = author_id;
    message.topic_id  = topic_id;
    message.reply_id  = reply_id;
    return message.save();
}

exports.sendReplyMessage = (master_id, author_id, topic_id, reply_id) => {
    return sendMessage(master_id, author_id, topic_id, reply_id, 'reply');
};

exports.sendAtMessage = (master_id, author_id, topic_id, reply_id) => {
    return sendMessage(master_id, author_id, topic_id, reply_id, 'at');
};
