'use strict';

const config = require('../config');

exports.github = async (ctx, next) => {
    if (config.GITHUB_OAUTH.clientID === 'your GITHUB_CLIENT_ID') {
        return await ctx.render('notify/notify', {error: 'call the admin to set github oauth'});
    }
    await next();
};
