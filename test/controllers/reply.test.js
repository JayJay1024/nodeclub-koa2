'use strict';

const support    = require('../support/support');
const ReplyProxy = require('../../proxy/reply');
const app        = require('../../app');
const request    = require('supertest')(app);
const should     = require('should');

describe('test/controllers/reply.test.js', function () {
    before(async function () {
        await support.ready();
    });

    let reply1Id;

    describe('reply1', function () {
        it('should add a reply1');

        it('should 422 when add a empty reply1');

        it('should not add a reply1 when not login', async function () {
            let res = await request.post('/' + support.testTopic._id + '/reply')
                .send({
                    r_content: 'test reply 1'
                });
            res.status.should.equal(403);
        });
    });

    describe('edit reply', function () {
        it('should not show edit page when not author');

        it('should show edit page when is author');

        it('should update edit');
    });

    describe('upvote reply', function () {

        it('should increase');

        it('should decrease');

    });

    describe('delete reply', function () {
        it('should should not delete when not author', async function () {
            let res = await request.post('/reply/' + reply1Id + '/delete')
                .send({
                    reply_id: reply1Id
                });
            res.status.should.equal(403);
        });

        it('should delete reply when author');
    });
});

