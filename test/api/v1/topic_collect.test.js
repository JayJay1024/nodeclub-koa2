'use strict';

const app     = require('../../../app');
const request = require('supertest')(app);
const should  = require('should');
const support = require('../../support/support');

describe('test/api/v1/topic_collect.test.js', function () {

    let mockUser, mockTopic;

    before(async function () {
        if (await support.ready()) {
            mockUser  = await support.createUser();
            mockTopic = await support.createTopic(mockUser._id);
        }
    });

    // 主题被收藏之前
    describe('before collect topic', function () {

        describe('get /topic_collect/:loginname', function () {

            it('should list topic with length = 0', async function () {
                    let res = await request.get('/api/v1/topic_collect/' + mockUser.loginname)
                    res.body.success.should.true();
                    res.body.data.length.should.equal(0);
            });
        });

        describe('get /api/v1/topic/:topicid', function () {

            it('should return topic info with is_collect = false', async function () {
                let res = await request
                    .get('/api/v1/topic/' + mockTopic.id)
                    .query({
                        accesstoken: mockUser.accessToken
                    });
                res.body.success.should.true();
                res.body.data.is_collect.should.false();
            });

        });

    });

    // 收藏主题
    describe('post /topic_collect/collect', function () {

        it('should 401 with no accessToken', async function () {
            let res = await request
                .post('/api/v1/topic_collect/collect')
                .send({
                    topic_id: mockTopic.id
                });
            res.status.should.equal(401);
            res.body.success.should.false();
        });

        it('should collect topic with correct accessToken', async function () {
            let res = await request
                .post('/api/v1/topic_collect/collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: mockTopic.id
                })
            res.body.success.should.true();
        });

        it('should not collect topic twice', async function () {
            let res = await request
                .post('/api/v1/topic_collect/collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: mockTopic.id
                });
            res.body.success.should.false();
        });

        it('should fail when topic_id is not valid', async function () {
            let res = await request
                .post('/api/v1/topic_collect/collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: mockTopic.id + "not_valid"
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail when topic not found',async function () {
            let notFoundTopicId = mockTopic.id.split("").reverse().join("");
            let res = await request
                .post('/api/v1/topic_collect/collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: notFoundTopicId
                });
            if (mockTopic.id === notFoundTopicId) { // 小概率事件id反转之后还不变
                res.body.success.should.true();
            } else {
                res.status.should.equal(404);
                res.body.success.should.false();
            }
        });

    });

    // 主题被收藏之后
    describe('after collect topic', function () {

        describe('get /topic_collect/:loginname', function () {

            it('should list topic with length = 1', async function () {
                let res = await request.get('/api/v1/topic_collect/' + mockUser.loginname);
                res.body.success.should.true();
                res.body.data.length.should.equal(1);
                res.body.data[0].id.should.equal(mockTopic.id);
            });

            it('should fail when user not found', async function () {
                let res = await request.get('/api/v1/topic_collect/' + mockUser.loginname + 'not_found');
                res.status.should.equal(404);
                res.body.success.should.false();
            });

        });

        describe('get /api/v1/topic/:topicid', function () {

            it('should return topic info with is_collect = true', async function () {
                let res = await request
                    .get('/api/v1/topic/' + mockTopic.id)
                    .query({
                        accesstoken: mockUser.accessToken
                    });
                res.body.success.should.true();
                res.body.data.is_collect.should.true();
            });

        });

    });

    // 取消收藏主题
    describe('post /topic_collect/de_collect', function () {

        it('should 401 with no accessToken', async function () {
            let res = await request
                .post('/api/v1/topic_collect/de_collect')
                .send({
                    topic_id: mockTopic.id
                });
            res.status.should.equal(401);
            res.body.success.should.false();
        });

        it('should decollect topic with correct accessToken', async function () {
            let res = await request
                .post('/api/v1/topic_collect/de_collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: mockTopic.id
                });
            res.body.success.should.true();
        });

        it('should not decollect topic twice', async function () {
            let res = await request
                .post('/api/v1/topic_collect/de_collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: mockTopic.id
                });
            res.body.success.should.false();
        });

        it('should fail when topic_id is not valid', async function () {
            let res = await request
                .post('/api/v1/topic_collect/de_collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: mockTopic.id + "not_valid"
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail when topic not found', async function () {
            let notFoundTopicId = mockTopic.id.split("").reverse().join("");
            let res = await request
                .post('/api/v1/topic_collect/de_collect')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: notFoundTopicId
                });
            if (mockTopic.id === notFoundTopicId) { // 小概率事件id反转之后还不变
                res.body.success.should.true();
            } else {
                res.status.should.equal(404);
                res.body.success.should.false();
            }
        });

    });

    // 主题被取消收藏之后
    describe('after decollect topic', function () {

        describe('get /topic_collect/:loginname', function () {

            it('should list topic with length = 0', async function () {
                let res = await request.get('/api/v1/topic_collect/' + mockUser.loginname);
                res.body.success.should.true();
                res.body.data.length.should.equal(0);
            });

        });

        describe('get /api/v1/topic/:topicid', function () {

            it('should return topic info with is_collect = false', async function () {
                let res = await request
                    .get('/api/v1/topic/' + mockTopic.id)
                    .query({
                        accesstoken: mockUser.accessToken
                    });
                res.body.success.should.true();
                res.body.data.is_collect.should.false();
            });

        });

    });

});
