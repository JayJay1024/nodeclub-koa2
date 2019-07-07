'use strict';

const support      = require('../../support/support');
const message      = require('../../../common/message');
const MessageProxy = require('../../../proxy').Message;
const app          = require('../../../app');
const request      = require('supertest')(app);
const mm           = require('mm');
const should       = require('should');

describe('test/api/v1/message.test.js', function () {

    let mockUser;

    before(async function () {
        if (await support.ready()) {
            mockUser = await support.createUser();
            await message.sendReplyMessage(mockUser.id, mockUser.id, mockUser.id, mockUser.id);
        }
    });

    beforeEach(function () {
        mm(MessageProxy, 'getMessageById', function (id) {
            return new Promise(resolve => {
                let res = {reply: {author: {}}};
                resolve(res);
            });
        });
    });

    afterEach(function () {
        mm.restore();
    });

    it('should get unread messages', async function () {
        let res = await request
            .get('/api/v1/messages')
            .query({
                accesstoken: mockUser.accessToken
            });
        res.body.success.should.be.true();
        res.body.data.has_read_messages.length.should.equal(0);
        res.body.data.hasnot_read_messages.length.should.equal(1);
    });

    it('should get unread messages count', async function () {
        let res = await request
            .get('/api/v1/message/count')
            .query({
                accesstoken: mockUser.accessToken
            });
        res.body.success.should.be.true();
        res.body.data.should.equal(1);
    });

    it('should mark all messages read', async function () {
        let res = await request
            .post('/api/v1/message/mark_all')
            .send({
                accesstoken: mockUser.accessToken
            });
        res.body.success.should.be.true();
        res.body.marked_msgs.length.should.equal(1);

        let res2 = await request
            .post('/api/v1/message/mark_all')
            .send({
                accesstoken: mockUser.accessToken
            });
        res2.body.success.should.be.true();
        res2.body.marked_msgs.length.should.equal(0);
    });
});
