'use strcit';

const app            = require('../../app');
const support        = require('../support/support');
const MessageService = require('../../common/message');
const ReplyProxy     = require('../../proxy').Reply;
const request        = require('supertest')(app);
const mm             = require('mm');
const should         = require('should');

describe('test/common/message.test.js', function () {
    let atUser, author, topic, reply;

    before(async function () {
        if (await support.ready()) {
            atUser = support.normalUser;
            author = atUser;
            reply = {};
            topic = await support.createTopic(author._id);
        }
    });

    afterEach(function () {
        mm.restore();
    });

    describe('#sendReplyMessage', function () {
        it('should send reply message');
    });

    describe('#sendAtMessage', function () {
        it('should send at message');
    });
});
