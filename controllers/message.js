'use strict';

const MessageProxy = require('../proxy').Message;

exports.index = async (ctx, next) => {
    let user_id = ctx.session.user._id;

    let has_read = await MessageProxy.getReadMessagesByUserId(user_id);
    let unread   = await MessageProxy.getUnreadMessageByUserId(user_id);

    let has_read_messages = [];
    for (let doc of has_read) {
        let message = await MessageProxy.getMessageRelations(doc);
        has_read_messages.push(message);
    }
    has_read_messages.filter((msg) => {
        return !msg.is_invalid;
    });

    let hasnot_read_messages = [];
    for (let doc of unread) {
        let message = await MessageProxy.getMessageRelations(doc);
        hasnot_read_messages.push(message);
    }
    hasnot_read_messages.filter((msg) => {
        return !msg.is_invalid;
    });

    await MessageProxy.updateMessagesToRead(user_id, unread);

    await ctx.render('message/index', {has_read_messages: has_read_messages, hasnot_read_messages: hasnot_read_messages});
    return await next();
};
