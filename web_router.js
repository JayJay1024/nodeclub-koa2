'use strict';

const config    = require('./config');
const passport  = require('koa-passport');
const Router    = require('koa-router');

// middlewares
const authMiddleware    = require('./middlewares/auth');
const limitMiddleware   = require('./middlewares/limit');
const configMiddleware  = require('./middlewares/conf');

// controllers
const signController    = require('./controllers/sign');
const siteController    = require('./controllers/site');
const rssController     = require('./controllers/rss');
const userController    = require('./controllers/user');
const staticController  = require('./controllers/static');
const githubController  = require('./controllers/github');
const messageController = require('./controllers/message');
const topicController   = require('./controllers/topic');
const replyController   = require('./controllers/reply');
const searchController  = require('./controllers/search');

const router = new Router();

router.get('/', siteController.index);                   // 首页
router.get('sitemap.xml', siteController.sitemap);       // sitemap
router.get('app/download', siteController.appDownload);  // mobile app download

// static pages
router.get('about', staticController.about);        // 关于
router.get('faq', staticController.faq);            // FAQ
router.get('getstart', staticController.getstart);  // 新手入门
router.get('robots.txt', staticController.robots);  // robots
router.get('api', staticController.api);            // api

// sign controller
if (config.allow_sign_up) {
    router.get('signup', signController.showSignup);  // 进入注册页面
    router.post('signup', signController.signup);     // 提交注册表单
} else {
    router.get('signup', async (ctx, next) => {
        await ctx.redirect('auth/github');            // 进行github验证
        await next();
    });
}
router.post('signout', signController.signout);               // 登出
router.get('signin', signController.showLogin);               // 进入登录页面
router.post('signin', signController.login);                  // 登录校验
router.get('active_account', signController.activeAccount);   // 帐号激活
router.get('search_pass', signController.showSearchPass);     // 找回密码页面
router.post('search_pass', signController.updateSearchPass);  // 提交更新密码表单
router.get('reset_pass', signController.resetPass);           // 重置密码页面
router.post('reset_pass', signController.updatePass);         // 提交重置密码表单

// user controller
router.get('user/:name', userController.index);     // 用户个人主页
router.get('setting', userController.showSetting);  // 用户个人设置页
router.post('setting', userController.setting);     // 提交设置表单
router.get('stars', userController.listStars);      // 显示所有达人列表
router.get('users/top100', userController.top100);  // 显示积分前一百用户页
router.get('user/:name/topics', userController.listTopics);                // 用户发布的所有话题页
router.get('user/:name/collections', userController.listCollectedTopics);  // 显示用户收藏的所有话题
router.get('user/:name/topics', userController.listTopics);                // 显示用户发布的所有话题
router.get('user/:name/replies', userController.listReplies);              // 显示用户参与的所有回复
router.post('user/set_star', authMiddleware.adminRequired, userController.toggleStar);         // 把用户设为达人
router.post('user/cancel_star', authMiddleware.adminRequired, userController.toggleStar);      // 取消用户的达人身份
router.post('user/:name/block', authMiddleware.adminRequired, userController.block);           // 禁言某用户
router.post('user/:name/delete_all', authMiddleware.adminRequired, userController.deleteAll);  // 删除某用户所有发言
router.post('user/refresh_token', authMiddleware.userRequired, userController.refreshToken);   // 刷新用户token

// topic controller
router.get('topic/:tid', topicController.index);                                           // 显示某个话题
router.post('topic/:tid/top', authMiddleware.adminRequired, topicController.top);          // 将某话题置顶
router.post('topic/:tid/good', authMiddleware.adminRequired, topicController.good);        // 将某话题加精
router.post('topic/:tid/lock', authMiddleware.adminRequired, topicController.lock);        // 锁定某话题，不能再回复
router.post('topic/:tid/delete', authMiddleware.userRequired, topicController.delete);     // 删除话题
router.get('topic/:tid/edit', authMiddleware.userRequired, topicController.showEdit);      // 编辑某话题
router.post('topic/:tid/edit', authMiddleware.userRequired, topicController.update);       // 提交话题编辑表单
router.post('topic/collect', authMiddleware.userRequired, topicController.collect);        // 关注某话题
router.post('topic/de_collect', authMiddleware.userRequired, topicController.de_collect);  // 取消关注某话题
router.post('upload', authMiddleware.userRequired, topicController.upload);                // 上传图片
router.get('topic/create', authMiddleware.userRequired, topicController.create);           // 新建文章页面
router.post('topic/create', authMiddleware.userRequired,
    limitMiddleware.peruserperday('create_topic', config.create_post_per_day, {showJson: false}), topicController.put);  // 保存新建的文章

// reply controller
router.get('reply/:reply_id/edit', authMiddleware.userRequired, replyController.showEdit);   // 修改自己的评论页面
router.post('reply/:reply_id/edit', authMiddleware.userRequired, replyController.update);    // 提交评论修改
router.post('reply/:reply_id/delete', authMiddleware.userRequired, replyController.delete);  // 删除某条评论
router.post('reply/:reply_id/up', authMiddleware.userRequired, replyController.up);          // 为某条评论点赞
router.post(':topic_id/reply', authMiddleware.userRequired,
    limitMiddleware.peruserperday('create_reply', config.create_reply_per_day, {showJson: false}), replyController.add);  // 提交一级回复

// rss controller
router.get('rss', rssController.index);

// search controller
router.get('search', searchController.index);

// message controler
router.get('my/messages', authMiddleware.userRequired, messageController.index);  // 用户个人的所有消息页

// github oauth
router.get('auth/github', configMiddleware.github, passport.authenticate('github'));
router.get('auth/github/callback', passport.authenticate('github', {failureRedirect: '/signin'}), githubController.callback);
router.get('auth/github/new', githubController.new);
router.post('auth/github/create', limitMiddleware.peripperday('create_user_per_ip', config.create_user_per_ip, {showJson: false}), githubController.create);

module.exports = router;
