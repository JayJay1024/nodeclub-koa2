'use strict';

const UserProxy  = require('../../proxy/user');
const TopicProxy = require('../../proxy/topic');
const ReplyProxy = require('../../proxy/reply');
const tools      = require('../../common/tools');
const logger     = require('../../common/logger');

const randomInt = () => {
    return (Math.random() * 10000).toFixed(0);
};

const createUser = async () => {
    try {
        let key = new Date().getTime() + '_' + randomInt();
        let passhash = await tools.bhash('pass');
        let user = await UserProxy.newAndSave('abcd' + key, 'abcd' + key, passhash, 'abcd' + key + '@gmail.com', '', false);
        return user;
    } catch (err) {
        logger.error(err);
    }
    return null;
};
exports.createUser = createUser;

const createUserByNameAndPwd = async (loginname, pwd) => {
    try {
        let passhash = await tools.bhash(pwd);
        let user = await UserProxy.newAndSave(loginname, loginname, passhash, loginname + new Date() + '@gmail.com', '', true);
        return user;
    } catch (err) {
        logger.error(err);
    }
    return null;
};
exports.createUserByNameAndPwd = createUserByNameAndPwd;

const createTopic = async (authorId) => {
    try {
        let key = new Date().getTime() + '_' + randomInt();
        let topic = await TopicProxy.newAndSave('topic title' + key, 'test topic content' + key, 'share', authorId);
        return topic;
    } catch (err) {
        logger.error(err);
    }
    return null;
};
exports.createTopic = createTopic;


const createReply = async (topicId, authorId) => {
    try {
        let reply = await ReplyProxy.newAndSave('I am content', topicId, authorId);
        return reply;
    } catch (err) {
        logger.error(err);
    }
    return null;
};
exports.createReply = createReply;

const createSingleUp = async (replyId, userId) => {
    try {
        let reply = await ReplyProxy.getReply(replyId);
        reply.ups = [];
        reply.ups.push(userId);
        return await reply.save();
    } catch (err) {
        logger.error(err);
    }
    return null;
};
exports.createSingleUp = createSingleUp;

const mockUser = (user) => {
  return 'mock_user=' + JSON.stringify(user) + ';';
};

const ready = async () => {
    try {
        let user  = await createUser();
        let user2 = await createUser();
        let admin = await createUser();

        exports.normalUser = user;
        exports.normalUserCookie = mockUser(user);
        exports.normalUser2 = user2;
        exports.normalUser2Cookie = mockUser(user2);

        let adminObj = JSON.parse(JSON.stringify(admin));
        adminObj.is_admin = true;
        exports.adminUser = admin;
        exports.adminUserCookie = mockUser(adminObj);

        let topic  = await createTopic(user._id);
        exports.testTopic = topic;

        const reply = await createReply(topic._id, user._id);
        exports.testReply = reply;

        return true;
    } catch (err) {
        logger.error(err);
    }
    return false;
};
exports.ready = ready;

