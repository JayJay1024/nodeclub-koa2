'use strict';
/*!
 * nodeclub - user controller test
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
const support    = require('../support/support');
const UserProxy  = require('../../proxy/user');
const ReplyModel = require('../../models').Reply;
const app        = require('../../app');
const request    = require('supertest')(app);
const _          = require('lodash');
const should     = require('should');

describe('test/controllers/user.test.js', function () {
    let testUser;
    before(async function () {
        if (await support.ready()) {
            testUser = await support.createUser();
        }
    });

    describe('#index', function () {
        it('should show user index', async function () {
            let res = await request.get('/user/' + testUser.loginname).expect(200);
            let texts = [
                '注册时间',
                '这家伙很懒，什么个性签名都没有留下。',
                '最近创建的话题',
                '无话题',
                '最近参与的话题',
                '无话题'
            ];
            texts.forEach(function (text) {
                res.text.should.containEql(text);
            });
        });
    });

    describe('#listStars', function () {
        it('should show star uses', async function () {
            let res = await request.get('/stars').expect(200);
            res.text.should.containEql('社区达人');
        });
    });

    describe('#showSetting', function () {
        it('should show setting page');

        it('should show success info');
    });

    describe('#setting', function () {

        it('should change user setting');

        it('should change user password');

        it('should not change user password when old_pass is wrong');
    });

    describe('#toggleStar', function () {
        it('should not set star user when no user_id');

        it('should set star user');

        it('should unset star user');
    });

    describe('#getCollectTopics', function () {
        it('should get /user/:name/collections ok', async function () {
            let res = await request.get('/user/' + support.normalUser.loginname + '/collections').expect(200);
            res.text.should.containEql('收藏的话题');
        });
    });

    describe('#top100', function () {
        it('should get /users/top100', async function () {
            let res = await request.get('/users/top100').expect(200);
            res.text.should.containEql('Top100 积分榜');
        });
    });

    describe('#list_topics', function () {
        it('should get /user/:name/topics ok', async function () {
            let res = await request.get('/user/' + support.normalUser.loginname + '/topics').expect(200);
            res.text.should.containEql('创建的话题');
        });
    });

    describe('#listReplies', function () {
        it('should get /user/:name/replies ok', async function () {
            let res = await request.get('/user/' + support.normalUser.loginname + '/replies').expect(200);
            res.text.should.containEql(support.normalUser.loginname + ' 参与的话题');
        });
    });

    describe('#block', function () {
        it('should block user');

        it('should unblock user');

        it('should wrong when user is not exists');
    });

    describe('#delete_all', function () {
        it('should delele all ups');
    })
});
