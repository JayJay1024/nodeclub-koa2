'use strict';

/**
 * 给所有的 Model 扩展功能
 * http://mongoosejs.com/docs/plugins.html
 */
const tools  = require('../common/tools');

// 这里使用了this对象，所以不要随便使用箭头函数
module.exports = function (schema) {
    schema.methods.create_at_ago = function () {
        return tools.formatDate(this.create_at, true);
    };
    schema.methods.update_at_ago = function () {
        return tools.formatDate(this.update_at, true);
    };
};
