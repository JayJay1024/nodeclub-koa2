'use strict';

const config       = require('../config');
const UserProxy    = require('../proxy').User;
const TopicProxy   = require('../proxy').Topic;
const cache        = require('../common/cache');
const renderHelper = require('../common/render_helper');
const moment       = require('moment');
const xmlbuilder   = require('xmlbuilder');

/**
 * home page
 */
exports.index = async (ctx, next) => {
    let tab     = ctx.query.tab || 'all';
    let tabName = renderHelper.tabName(tab);          // 中文名称
    let limit   = config.list_topic_count;            // 话题列表每页显示多少话题
    let page    = parseInt(ctx.query.page, 10) || 1;  // 话题列表页数
    page        = page > 0 ? page : 1;

    let query = {};
    if (!tab || tab === 'all') {
        query.tab = {$nin: ['job', 'dev']}  // 不包括招聘、客户端测试
    } else {
        if (tab === 'good') {
            query.good = true;  // 精华
        } else {
            query.tab = tab;
        }
    }
    if (!query.good) {
        query.create_at = {$gte: moment().subtract(1, 'years').toDate()};
    }

    let options = {
        skip: (page - 1) * limit,
        limit: limit,
        sort: '-top -last_reply_at',
    }
    let topics = [], tops = [], no_reply_topics = [], pages = 0;

    // 1. 取主题
    topics = await TopicProxy.getTopicsByQuery(query, options);

    // 2. 取积分排行榜上的用户
    tops = await cache.get('tops');
    if (!tops) {
        tops = await UserProxy.getUsersByQuery({is_block: false}, {limit: 10, sort: '-score'});
        await cache.set('tops', tops, 60 * 1);
    }

    // 3. 取0回复的主题
    no_reply_topics = await cache.get('no_reply_topics');
    if (!no_reply_topics) {
        no_reply_topics = await TopicProxy.getTopicsByQuery({reply_count: 0, tab: {$nin: ['job', 'dev']}}, {limit: 5, sort: '-create_at'});
        await cache.set('no_reply_topics', no_reply_topics, 60 * 1);
    }

    // 4. 取分页数据
    let pagesCacheKey = JSON.stringify(query) + 'pages';
    pages = await cache.get(pagesCacheKey);
    if (!pages) {
        let all_topics_count = await TopicProxy.getCountByQuery(query);
        pages = Math.ceil(all_topics_count / limit);
        await cache.set(pagesCacheKey, pages, 60 * 1);
    }

    await ctx.render('index', {
        topics: topics,
        current_page: page,
        list_topic_count: limit,
        tops: tops,
        no_reply_topics: no_reply_topics,
        pages: pages,
        tabs: config.tabs,
        tab: tab,
        pageTitle: tabName && (tabName + '版块'),
    });
    await next();
};

exports.sitemap = async (ctx, next) => {
    let urlset = xmlbuilder.create('urlset', {version: '1.0', encoding: 'UTF-8'});
    urlset.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

    let sitemapData = await cache.get('sitemap');
    if (!sitemapData) {
        let topics = await TopicProxy.getLimit5w();
        for (let topic of topics) {
            urlset.ele('url').ele('loc', 'http://cnodejs.org/topic/' + topic._id);
        }
        sitemapData = urlset.end();
        await cache.set('sitemap', sitemapData, 3600 * 24);  // 缓存一天
    }
    ctx.type = 'xml';
    ctx.body = sitemapData;
    await next();
};

exports.appDownload = async (ctx, next) => {
    await ctx.redirect('https://github.com/soliury/noder-react-native/blob/master/README.md');
    await next();
};
