'use strict';

const urllib  = require('url');
const request = require('request');
// const rp      = require('request-promise');
const logger  = require('../common/logger');
const _       = require('lodash');

const ALLOW_HOSTNAME = [
    'avatars.githubusercontent.com',
    'www.gravatar.com',
    'gravatar.com',
    'www.google-analytics.com',
];

const requestPromise = (opts) => {
    return new Promise((resolve, reject) => {
        request.get(opts, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                resolve({response, body});
            }
        });
    });
}

exports.proxy = async (ctx, next) => {
    let url = decodeURIComponent(ctx.query.url);
    let hostname = urllib.parse(url).hostname;

    if (ALLOW_HOSTNAME.indexOf(hostname) === -1) {
        return await ctx.render('notify/notify', {error: `${hostname} is not allowed`});
    }

    let {response, body} = await requestPromise({
        url: url,
        headers: _.omit(ctx.headers, ['cookie', 'refer']),
    });
    ctx.set(response.headers);
    ctx.body = body;

    await next();
};
