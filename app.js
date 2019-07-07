'use strict';

require('colors');
require('./models');
require('./middlewares/mongoose_log');  // 打印 mongodb 查询日志

const config                   = require('./config');
const logger                   = require('./common/logger');

const webRouter                = require('./web_router');
const apiRouterV1              = require('./api_router_v1');

const githubStrategyMiddleware = require('./middlewares/github_strategy');
const proxyMiddleware          = require('./middlewares/proxy');
const authMiddleware           = require('./middlewares/auth');
const requestLogMiddleware     = require('./middlewares/request_log');
const errorPageMiddleware      = require('./middlewares/error_page');

const Koa                      = require('koa');
const Router                   = require('koa-router');
const cors                     = require('koa2-cors');
const koaBody                  = require('koa-body');
const Loader                   = require('loader');
const staticServer             = require('koa-static');
const render                   = require('koa-art-template');
const session                  = require('koa-session');
const passport                 = require('koa-passport');
const githubStrategy           = require('passport-github2').Strategy;
const path                     = require('path');
const _                        = require('lodash');
const responseTime             = require('koa-response-time');
const bytes                    = require('bytes');
const compress                 = require('koa-compress');
const onerror                  = require('koa-onerror');
const CSRF                     = require('koa-csrf');
const helmet                   = require("koa-helmet");
const RateLimit                = require('koa2-ratelimit').RateLimit;

const app                      = new Koa();
const router                   = new Router();


const urlinfo   = require('url').parse(config.app_host);
config.hostname = urlinfo.hostname || config.app_host;

let assets = {};
if (config.mini_assets) {
    try {
        assets = require('./assets.json');
    } catch (err) {
        logger.error('You must execute `make build` before start app when mini_assets is true.');
        throw(err);
    }
}

if (config.debug) {
    onerror(app);
} else {
    app.on('error', async (err, ctx) => {
        logger.error('app error event:\n', err);
        ctx.status = 500;
        ctx.response.body = '500 status';
    });
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            logger.error('app catch error:\n', err);
            ctx.type = 'application/json';
            ctx.status = 500;
            ctx.body = {success: false, error_msg: 'something error!'};
        }
    });
}

app.use(responseTime());  // 将在response headers中设置'X-Response-Time'
app.use(cors());          // 跨域
app.use(compress());      // 页面压缩
app.use(koaBody({         // 解析 post data、上传下载文件
    multipart: true,      // 支持文件上传
    formidable: {
        maxFieldsSize: bytes(config.file_upload_limit),  // 上传文件大小限制
    },
}));

// session
app.keys = [config.session_secret];
app.use(session(config.session_config, app));

if (!config.debug) {
    app.use(new CSRF({
        invalidTokenMessage: 'Invalid CSRF token',
        invalidTokenStatusCode: 403,
        excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
        disableQuery: false
    }));
}
app.use(helmet());
// app.use(RateLimit.middleware({
//     interval: { min: 15 }, // 15 minutes = 15*60*1000
//     max: 3000, // limit each IP to 3000 requests per interval
// }));

// 静态资源
app.use(staticServer(__dirname + '/public'));
app.use(staticServer(__dirname + '/'));

// 绑定到ctx.state
app.use(async (ctx, next) => {
    _.extend(ctx.state, {
        csrf: ctx.csrf ? ctx.csrf : '',
        config: config,
        assets: assets,
        Loader: Loader,
    });
    _.extend(ctx.state, require('./common/render_helper'));
    await next();
});

// 模板引擎
render(app, {
    root: path.join(__dirname, 'views'),
    extname: '.html',
    debug: process.env.NODE_ENV !== 'production',
});

// 绑定error page的渲染方法到ctx
app.use(errorPageMiddleware.errorPage);

// passport
app.use(passport.initialize());
// app.use(passport.session());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
passport.use(new githubStrategy(config.GITHUB_OAUTH, githubStrategyMiddleware));

// custom middleware
app.use(authMiddleware.authUser);
app.use(authMiddleware.blockUser);

app.use(requestLogMiddleware);

// use router
app.use(router.routes())
   .use(router.allowedMethods());

router.get('/agent', proxyMiddleware.proxy);
router.use('/', webRouter.routes())
      .use('/', webRouter.allowedMethods());
router.use('/api/v1', apiRouterV1.routes())
      .use('/api/v1', apiRouterV1.allowedMethods());

if (!module.parent) {
    app.listen(config.app_port, () => {
        logger.info('server listening on port:', config.app_port);
        logger.info('god bless love...');
        logger.info(`you can debug your app with http://${config.hostname}:${config.app_port}`);
    });
} else {
    module.exports = app.listen(config.app_port);  // for mocha test
}
