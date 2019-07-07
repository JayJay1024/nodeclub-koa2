'use strict';

const Message   = require('./message');
const UserProxy = require('../proxy').User;
const _         = require('lodash');

/**
 * 从文本中提取出 @username 标记的用户名数组
 */
const fetchUsers = (text) => {
    if (!text) { return []; }

    let ignoreRegexs = [
        /```.+?```/g,              // 去除单行的 ```
        /^```[\s\S]+?^```/gm,      // ``` 里面的是 pre 标签内容
        /`[\s\S]+?`/g,             // 同一行中，`some code` 中内容也不该被解析
        /^    .*/gm,               // 4个空格也是 pre 标签，在这里 . 不会匹配换行
        /\b\S*?@[^\s]*?\..+?\b/g,  // somebody@gmail.com 会被去除
        /\[@.+?\]\(\/.+?\)/g,      // 已经被 link 的 username
    ];

    for (let ignore_regex of ignoreRegexs) {
        text = text.replace(ignore_regex, '');
    }

    let names = [];
    let results = text.match(/@[a-z0-9\-_]+\b/igm);
    if (results) {
        for (let i = 0, l = results.length; i < l; i++) {
            let s = results[i];
            s = s.slice(1);  // remove leading char @
            names.push(s);
        }
    }
    names = _.uniq(names);
    return names;
};
exports.fetchUsers = fetchUsers;

/**
 * 发送消息给文本中被 @ 的的用户
 */
exports.sendMessageToMentionUsers = async (text, topicId, authorId, reply_id) => {
    let users = await UserProxy.getUsersByNames(fetchUsers(text));
    users = users.filter((user) => {
        return !user._id.equals(authorId);
    });

    for (let user of users) {
        await Message.sendAtMessage(user._id, authorId, topicId, reply_id);
    }
};

/**
 * 根据文本内容，替换为数据库中的数据
 */
exports.linkUsers = (text) => {
    let users = fetchUsers(text);
    for (let i = 0, l = users.length; i < l; i++) {
        let name = users[i];
        text = text.replace(new RegExp('@' + name + '\\b(?!\\])', 'g'), '[@' + name + '](/user/' + name + ')');
    }
    return text;
};
