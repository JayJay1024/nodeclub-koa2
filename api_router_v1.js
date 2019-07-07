'use strict';

const config     = require('./config');
const limit      = require('./middlewares/limit');
const middleware = require('./api/v1/middleware');

// controllers
const replyController        = require('./api/v1/reply');
const toolsController        = require('./api/v1/tools');
const userController         = require('./api/v1/user');
const messageController      = require('./api/v1/message');
const topicController        = require('./api/v1/topic');
const topicCollectController = require('./api/v1/topic_collect');

const Router = require('koa-router');
const router = new Router();

// 用户
router.get('/user/:loginname', userController.show);

// accessToken 测试
router.post('/accesstoken', middleware.auth, toolsController.accessToken);

// 主题
router.get('/topics', topicController.index);
router.get('/topic/:id', middleware.tryAuth, topicController.show);
router.post('/topics', middleware.auth, limit.peruserperday('create_topic', config.create_post_per_day, {showJson: true}), topicController.create);
router.post('/topics/update', middleware.auth, topicController.update);

// 主题收藏
router.get('/topic_collect/:loginname', topicCollectController.list);  // 列出某用户收藏的话题
router.post('/topic_collect/collect', middleware.auth, topicCollectController.collect);  // 关注某话题
router.post('/topic_collect/de_collect', middleware.auth, topicCollectController.de_collect);  // 取消关注某话题

// 评论
router.post('/reply/:reply_id/ups', middleware.auth, replyController.ups);
router.post('/topic/:topic_id/replies', middleware.auth, limit.peruserperday('create_reply', config.create_reply_per_day, {showJson: true}), replyController.create);

// 通知
router.get('/messages', middleware.auth, messageController.index);
router.get('/message/count', middleware.auth, messageController.count);
router.post('/message/mark_all', middleware.auth, messageController.markAll);
router.post('/message/mark_one/:msg_id', middleware.auth, messageController.markOne);

module.exports = router;
