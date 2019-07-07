'use strict';

const logger = require('../common/logger');

// patch ctx.render method to output logger
exports.render = async (ctx, next) => {
    ctx._render = ctx.render;
    ctx.render = async (view, options, fn) => {
        let t = new Date();
        await ctx._render(view, options, fn);
        let duration = (new Date() - t);
        logger.debug("Render view", view, ("(" + duration + "ms)"));
    };
};
