'use strict';

const limit   = require('../../../middlewares/limit');
const support = require('../../support/support');
const app     = require('../../../app');
const request = require('supertest')(app);
const mm      = require('mm');
const should  = require('should');

describe('test/api/v1/reply.test.js', function () {

    let mockTopic, mockReplyId;
  
    before(async function () {
        if (await support.ready()) {
            mockTopic = await support.createTopic(support.normalUser.id);
        }
    });

    describe('create reply', function () {

        it('should success', async function () {
            let res = await request
                .post('/api/v1/topic/' + mockTopic.id + '/replies')
                .send({
                    content: 'reply a topic from api',
                    accesstoken: support.normalUser.accessToken
                });
            res.body.success.should.be.true();
            res.body.reply_id.length.should.equal(24);
            mockReplyId = res.body.reply_id;
        });

        it('should success with repli_id', async function () {
            let res = await request
                .post('/api/v1/topic/' + mockTopic.id + '/replies')
                .send({
                    content: 'reply a topic from api',
                    accesstoken: support.normalUser.accessToken,
                    repli_id: mockReplyId
                });
            res.body.success.should.be.true();
            res.body.reply_id.length.should.equal(24);
        });

        it('should 401 when no accessToken', async function () {
            let res = await request
                .post('/api/v1/topic/' + mockTopic.id + 'not_valid' + '/replies')
                .send({
                    content: 'reply a topic from api'
                });
            res.status.should.equal(401);
            res.body.success.should.false();
        });

        it('should fail when topic_id is not valid', async function () {
            let res = await request
                .post('/api/v1/topic/' + mockTopic.id + 'not_valid' + '/replies')
                .send({
                    content: 'reply a topic from api',
                    accesstoken: support.normalUser.accessToken
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail when no content', async function () {
            let res = await request
                .post('/api/v1/topic/' + mockTopic.id + '/replies')
                .send({
                    content: '',
                    accesstoken: support.normalUser.accessToken
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail when topic not found', async function () {
            let notFoundTopicId = mockTopic.id.split("").reverse().join("");
            let res = await request
                .post('/api/v1/topic/' + notFoundTopicId + '/replies')
                .send({
                    content: 'reply a topic from api',
                    accesstoken: support.normalUser.accessToken
                });
            if (mockTopic.id === notFoundTopicId) { // 小概率事件id反转之后还不变
                res.body.success.should.true();
            } else {
                res.status.should.equal(404);
                res.body.success.should.false();
            }
        });

        it('should fail when topic is locked', async function () {
            // 锁住 topic
            mockTopic.lock = !mockTopic.lock;
            await mockTopic.save();

            let res = await request
                .post('/api/v1/topic/' + mockTopic.id + '/replies')
                .send({
                    content: 'reply a topic from api',
                    accesstoken: support.normalUser.accessToken
                });
            res.status.should.equal(403);
            res.body.success.should.false();
            // 解锁 topic
            mockTopic.lock = !mockTopic.lock;
            await mockTopic.save();
        });

    });
  
    describe('create ups', function () {

        it('should up', async function () {
            let res = await request
                .post('/api/v1/reply/' + mockReplyId + '/ups')
                .send({
                    accesstoken: support.normalUser2.accessToken
                });
            res.body.success.should.true();
            res.body.action.should.equal("up");
        });

        it('should down', async function () {
            let res = await request
                .post('/api/v1/reply/' + mockReplyId + '/ups')
                .send({
                    accesstoken: support.normalUser2.accessToken
                });
            res.body.success.should.true();
            res.body.action.should.equal("down");
        });

        it('should 401 when no accessToken', async function () {
            let res = await request.post('/api/v1/reply/' + mockReplyId + '/ups');
            res.status.should.equal(401);
            res.body.success.should.false();
        });

        it('should fail when reply_id is not valid', async function () {
            let res = await request
                .post('/api/v1/reply/' + mockReplyId + 'not_valid' + '/ups')
                .send({
                    accesstoken: support.normalUser.accessToken
                });
            res.status.should.equal(400);
            res.body.success.should.false();
        });

        it('should fail when reply_id is not found', async function () {
            let notFoundReplyId = mockReplyId.split("").reverse().join("");
            let res = await request
                .post('/api/v1/reply/' + notFoundReplyId + '/ups')
                .send({
                    accesstoken: support.normalUser.accessToken
                });
            if (mockReplyId === notFoundReplyId) { // 小概率事件id反转之后还不变
                res.body.success.should.true();
            } else {
                res.status.should.equal(404);
                res.body.success.should.false();
            }
        });
    });
});
