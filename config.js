'use strict';

const path = require('path');

const config = {
    debug: true,
    log_dir: path.join(__dirname, 'logs'),

    get mini_assets() { return !this.debug; },  // 是否启用静态文件的合并压缩，详见视图中的Loader

    app_port: 3030,  // 程序运行端口
    app_host: 'localhost',  // 社区域名

    name: 'Nodeclub',  // 社区名字
    description: 'CNode：Node.js专业中文社区',  // 社区的描述
    keywords: 'nodejs, node, koa, socket.io',

    // 是否允许直接注册（否则只能走 github 的方式）
    allow_sign_up: true,

    // admin 可删除话题，编辑标签。把 user_login_name 换成你的登录名
    admins: { user_login_name: true },

    session_secret: 'nodeclub_koa_secret',  // 务必修改
    session_config: {
        key: 'nodeclub:koa',
        maxAge: 86400000,  // 过期时间为1天
        autoCommit: true,
        overwrite: true,
        httpOnly: true,
        signed: true,
        rolling: true,  // 每次response都重新设置maxAge
        renew: false,
    },
    auth_cookie_name: 'nodeclub_koa',

    // github 登陆的配置
    GITHUB_OAUTH: {
        clientID: 'your GITHUB_CLIENT_ID',
        clientSecret: 'your GITHUB_CLIENT_SECRET',
        callbackURL: 'http://localhost:3030/auth/github/callback'
    },

    // 邮箱配置（用于发激活码等）
    mail_opts: {
        host: 'smtp.126.com',
        port: 25,
        auth: {
            user: 'club@126.com',
            pass: 'club'  // 授权码
        },
        ignoreTLS: true,
    },

    //weibo app key
    weibo_key: 10000000,
    weibo_id: 'your_weibo_id',

    // 文件上传配置
    qn_access: {  // 7牛的access信息，用于文件上传
        accessKey: 'your access key',
        secretKey: 'your secret key',
        bucket: 'your bucket name',
        origin: 'http://your qiniu domain',
        // 如果vps在国外，请使用 http://up.qiniug.com/ ，这是七牛的国际节点
        // 如果在国内，此项请留空
        uploadURL: 'http://xxxxxxxx',
    },
    upload: {  // 注：如果填写 qn_access，则会上传到 7牛，以下配置无效
        path: path.join(__dirname, 'public/upload/'),
        url: '/public/upload/'
    },

    // 添加到 html head 中的信息
    site_headers: [
        '<meta name="author" content="EDP@TAOBAO" />'
    ],

    site_logo: '/images/cnodejs_light.svg',  // default is `name`
    site_icon: '/images/cnode_icon_32.png',  // 默认没有 favicon, 这里填写网址

    // 右上角的导航区
    site_navs: [
        // 格式 [ path, title, [target=''] ]
        [ '/about', '关于' ]
    ],

    // RSS配置
    rss: {
        title: 'CNode：Node.js专业中文社区',
        link: 'http://cnodejs.org',
        language: 'zh-cn',
        description: 'CNode：Node.js专业中文社区',
        //最多获取的RSS Item数量
        max_rss_items: 50
    },

    // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/
    google_tracker_id: '',
    // 默认的cnzz tracker ID，自有站点请修改
    cnzz_tracker_id: '',

    // 静态文件存储域名
    site_static_host: '',

    // mongodb 配置
    db_mongo: 'mongodb://127.0.0.1/nodeclub_koa',

    // redis 配置，默认是本地
    redis_host: '127.0.0.1',
    redis_port: 6379,
    redis_db: 0,
    redis_password: '',

    // 版块
    tabs: [
        ['share', '分享'],
        ['ask', '问答'],
        ['job', '招聘'],
    ],

    // 极光推送
    jpush: {
        appKey: 'YourAccessKeyyyyyyyyyyyy',
        masterSecret: 'YourSecretKeyyyyyyyyyyyyy',
        isDebug: false,
    },

    file_upload_limit: '1MB',   // 上传文件大小限制

    list_topic_count: 20,       // 话题列表每页显示的话题数
    visit_per_day: 1000,        // 每个 ip 每天能访问的次数
    create_user_per_ip: 1000,   // 每个 ip 每天可以注册账号的次数
    create_post_per_day: 1000,  // 每个用户一天可以发的主题数
    create_reply_per_day: 1000, // 每个用户一天可以发的评论数
}

if (process.env.NODE_ENV !== 'production') {
    config.db_mongo = 'mongodb://127.0.0.1/nodeclub_koa_dev';
}

module.exports = config;
