'use strict';

const config       = require('../config');
const TopicProxy   = require('../proxy').Topic;
const logger       = require('../common/logger');
const cache        = require('../common/cache');
const renderHelper = require('../common/render_helper');
const convert      = require('data2xml')();

const utf8ForXml = (inputStr) => {
    return inputStr.replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm, '');
};

exports.index = async (ctx, next) => {
    try {
        if (!config.rss) {
            ctx.status = 404;
            return ctx.body = 'Please set `rss` in config.js';
        }

        let rss = await cache.get('rss');
        if (rss) {
            ctx.type = 'application/xml';
            ctx.body = rss;
        } else {
            let opt = {
                limit: config.rss.max_rss_items,
                sort: '-create_at',
            };
            let topics = await TopicProxy.getTopicsByQuery({tab: {$nin: ['dev']}}, opt);
            let rss_obj = {
                _attr: { version: '2.0' },
                channel: {
                    title: config.rss.title,
                    link: config.rss.link,
                    language: config.rss.language,
                    description: config.rss.description,
                    item: [],
                }
            };
            for (let topic of topics) {
                rss_obj.channel.item.push({
                    title: topic.title,
                    link: config.rss.link + '/topic/' + topic._id,
                    guid: config.rss.link + '/topic/' + topic._id,
                    description: renderHelper.markdown(topic.content),
                    author: topic.author.loginname,
                    pubDate: topic.create_at.toUTCString()
                });
            }
            let rssContent = convert('rss', rss_obj);
            rssContent = utf8ForXml(rssContent);
            await cache.set('rss', rssContent, 60 * 5);  // 5分钟过期
            ctx.type = 'application/xml';
            ctx.body = rssContent;
        }
        return await next();
    } catch (err) {
        logger.error(err);
    }
    ctx.body = '服务器开小差啦';
};
