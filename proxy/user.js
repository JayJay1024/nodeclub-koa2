'use strict';

const utility   = require('utility');
const uuid      = require('node-uuid');
const UserModel = require('../models').User;

/**
 * 根据用户名列表查找用户列表
 */
exports.getUsersByNames = (names) => {
    if (names.length) {
        return UserModel.find({loginname: {$in: names}}).exec();
    }
    return [];
};

/**
 * 根据登录名查找用户
 */
exports.getUserByLoginName = (loginName) => {
    if (loginName) {
        return UserModel.findOne({loginname: new RegExp('^'+loginName+'$', "i")}).exec();
    }
    return null;
};

/**
 * 根据用户ID，查找用户
 */
exports.getUserById = (id, lean=false) => {
    if (id) {
        return UserModel.findOne({_id: id}, '',{lean: lean}).exec();
    }
    return null;
};

/**
 * 根据邮箱，查找用户
 */
exports.getUserByMail = (email) => {
    if (email) {
        return UserModel.findOne({email: email}).exec();
    }
    return null;
};

/**
 * 根据用户ID列表，获取一组用户
 */
exports.getUsersByIds = (ids) => {
    if (ids.length) {
        return UserModel.find({_id: {$in: ids}}).exec();
    }
    return [];
};

/**
 * 根据关键字，获取一组用户
 */
exports.getUsersByQuery = (query, opt=null) => {
    return UserModel.find(query, '', opt).exec();
};

/**
 * 根据查询条件，获取一个用户
 */
exports.getUserByNameAndKey = (loginname, key) => {
    return UserModel.findOne({loginname: loginname, retrieve_key: key}).exec();
};

exports.newAndSave = (name, loginname, pass, email, avatar_url, active=false) => {
    let user         = new UserModel();
    user.name        = name;
    user.loginname   = loginname;
    user.pass        = pass;
    user.email       = email;
    user.avatar      = avatar_url;
    user.active      = active;
    user.accessToken = uuid.v4();
    return user.save();
};

const makeGravatar = (email) => {
    return 'http://www.gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48';
};
exports.makeGravatar = makeGravatar;

exports.getGravatar = (user) => {
    return user.avatar || makeGravatar(user);
};
