'use strict';

exports.index = async (ctx, next) => {
    let q = ctx.query.q;
    q = encodeURIComponent(q);
    await ctx.redirect('https://www.google.com.hk/#hl=zh-CN&q=site:cnodejs.org+' + q);
    return await next();
};
