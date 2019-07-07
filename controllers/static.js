'use strict';

/**
 * 静态页面
 */

exports.about = async (ctx, next) => {
    await ctx.render('static/about', {
        pageTitle: '关于我们',
    });
    await next();
};

exports.faq = async (ctx, next) => {
    await ctx.render('static/faq');
    await next();
};

exports.getstart = async (ctx, next) => {
    ctx.render('static/getstart', {
        pageTitle: 'Node.js 新手入门',
    });
    await next();
};

exports.robots = async (ctx, next) => {
    ctx.type = 'text/plain';
    ctx.body = `
# See http://www.robotstxt.org/robotstxt.html for documentation on how to use the robots.txt file
#
# To ban all spiders from the entire site uncomment the next two lines:
# User-Agent: *
# Disallow: /`;
    await next();
};

exports.api = async (ctx, next) => {
    await ctx.render('static/api');
    await next();
};
