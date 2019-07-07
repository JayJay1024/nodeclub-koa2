'use strict';

const should  = require('should');
const app     = require('../../../app');
const request = require('supertest')(app);
const support = require('../../support/support');

describe('test/api/v1/topic.test.js', function () {
  
    let mockUser, mockTopic, mockReply;
    let createdTopicId = null;

    before(async function () {
        if (await support.ready()) {
            mockUser = await support.createUser();
            mockTopic = await support.createTopic(mockUser.id);
            await support.createTopic(support.normalUser.id);
            mockReply = await support.createReply(mockTopic.id, mockUser.id);
        }
    });

    describe('get /api/v1/topics', function () {

        it('should return topics', async function () {
            let res = await request.get('/api/v1/topics');
            res.body.success.should.true();
            res.body.data.length.should.above(0);
        });

        it('should return topics with limit 2', async function () {
            let res = await request
                .get('/api/v1/topics')
                .query({
                    limit: 2
                });
            res.body.success.should.true();
            res.body.data.length.should.equal(2);
        });

    });

    describe('get /api/v1/topic/:topicid', function () {

        it('should return topic info', async function () {
            let res = await request.get('/api/v1/topic/' + mockTopic.id);
            res.body.success.should.true();
            res.body.data.id.should.equal(mockTopic.id);
        });

        it('should fail when topic_id is not valid', async function () {
            let res = await request.get('/api/v1/topic/' + mockTopic.id + 'not_valid');
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail when topic not found', async function () {
            let notFoundTopicId = mockTopic.id.split("").reverse().join("");
            let res = await request.get('/api/v1/topic/' + notFoundTopicId);
            if (mockTopic.id === notFoundTopicId) { // 小概率事件id反转之后还不变
                res.body.success.should.true();
                res.body.data.id.should.equal(mockTopic.id);
            } else {
                res.status.should.equal(404);
                res.body.success.should.false();
            }
        });

        it('should up', async function () {
            let res = await request
                .post('/api/v1/reply/' + mockReply.id + '/ups')
                .send({
                    accesstoken: support.normalUser.accessToken
                });
            res.body.success.should.true();
            res.body.action.should.equal("up");
        });

        it('should is_uped to be false without accesstoken', async function () {
            let res = await request.get('/api/v1/topic/' + mockTopic.id);
            res.body.data.replies[0].is_uped.should.false();
        });

        it('should is_uped to be false with wrong accesstoken', async function () {
            let res = await request
                .get('/api/v1/topic/' + mockTopic.id)
                .query({
                    accesstoken: support.normalUser2.accessToken
                });
            res.body.data.replies[0].is_uped.should.false();
        });

        it('should is_uped to be true with right accesstoken', async function () {
            let res = await request
                .get('/api/v1/topic/' + mockTopic.id)
                .query({
                    accesstoken: support.normalUser.accessToken
                });
            res.body.data.replies[0].is_uped.should.true();
        });

    });

    describe('post /api/v1/topics', function () {

        it('should create a topic', async function () {
            let res = await request
                .post('/api/v1/topics')
                .send({
                    accesstoken: mockUser.accessToken,
                    title: '我是API测试标题',
                    tab: 'share',
                    content: '我是API测试内容'
                });
            res.body.success.should.true();
            res.body.topic_id.should.be.String();
            createdTopicId = res.body.topic_id
        });

        it('should 401 with no accessToken', async function () {
            let res = await request
                .post('/api/v1/topics')
                .send({
                    title: '我是API测试标题',
                    tab: 'share',
                    content: '我是API测试内容'
                });
            res.status.should.equal(401);
            res.body.success.should.false();
        });

        it('should fail with no title', async function () {
            let res = await request
                .post('/api/v1/topics')
                .send({
                    accesstoken: mockUser.accessToken,
                    title: '',
                    tab: 'share',
                    content: '我是API测试内容'
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail with error tab', async function () {
            let res = await request
                .post('/api/v1/topics')
                .send({
                    accesstoken: mockUser.accessToken,
                    title: '我是API测试标题',
                    tab: '',
                    content: '我是API测试内容'
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail with no content', async function () {
            let res = await request
                .post('/api/v1/topics')
                .send({
                    accesstoken: mockUser.accessToken,
                    title: '我是API测试标题',
                    tab: 'share',
                    content: ''
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

    });

    describe('post /api/v1/topics/update', function () {

        it('should update a topic', async function () {
            let res = await request
                .post('/api/v1/topics/update')
                .send({
                    accesstoken: mockUser.accessToken,
                    topic_id: createdTopicId,
                    title: '我是API测试标题',
                    tab: 'share',
                    content: '我是API测试内容 /api/v1/topics/update'
                });
            res.body.success.should.true();
            res.body.topic_id.should.eql(createdTopicId);
        });
    });
});
