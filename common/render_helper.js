"use strict";

const config     = require('../config');
const MarkdownIt = require('markdown-it');
const _          = require('lodash');
const validator  = require('validator');
const jsxss      = require('xss');

const md = new MarkdownIt();
md.set({
    html: false,
    xhtmlOut: false,
    breaks: false,
    linkify: true,
    typographer: true,
});

md.renderer.rules.fence = (tokens, idx) => {
    let token    = tokens[idx];
    let language = token.info && ('language-' + token.info) || '';
    language     = validator.escape(language);

    return `<pre class="prettyprint ${language}">`
        + `<code>${validator.escape(token.content)}</code>`
        + `</pre>`;
};

md.renderer.rules.code_block = (tokens, idx) => {
    let token = tokens[idx];

    return `<pre class="prettyprint">`
        + `<code>${validator.escape(token.content)}</code>`
        + `</pre>`;
};

const myxss = new jsxss.FilterXSS({
    onIgnoreTagAttr: (tag, name, value, isWhiteAttr) => {
        // 让 prettyprint 可以工作
        if (tag === 'pre' && name === 'class') {
            return `${name}="${jsxss.escapeAttrValue(value)}"`;
        }
    }
});

exports.markdown = (text) => {
    return '<div class="markdown-text">' + myxss.process(md.render(text || '')) + '</div>';
};

exports.escapeSignature = (signature) => {
    return signature.split('\n').map((p) => {
        return _.escape(p);
    }).join('<br>');
};

exports.staticFile = (filePath) => {
    if (filePath.indexOf('http') === 0 || filePath.indexOf('//') === 0) {
        return filePath;
    }
    return config.site_static_host + filePath;
};

exports.tabName = (tab) => {
    let pair = _.find(config.tabs, (_pair) => {
        return _pair[0] === tab;
    });
    if (pair) {
        return pair[1];
    }
};

exports.proxy = (url) => {
    return url;
    // 当 google 和 github 封锁严重时，则需要通过服务器代理访问它们的静态资源
    // return '/agent?url=' + encodeURIComponent(url);
};

// 为了在 view 中使用（会把这些exports放到ctx.state中）
exports._ = _;
