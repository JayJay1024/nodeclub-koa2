'user strict';

exports.errorPage = async (ctx, next) => {
    ctx.render404 = async (error) => {
        ctx.status = 404;
        return await ctx.render('notify/notify', {error: error});
    };
    ctx.renderError = async (error, statusCode=404) => {
        ctx.status = statusCode;
        return await ctx.render('notify/notify', {error: error});
    };
    await next();
};
