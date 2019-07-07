'use strict';

const app     = require('../../app');
const support = require('../support/support');
const request = require('supertest')(app);
const should  = require('should');

describe('test/controllers/message.test.js', function () {
    before(async function () {
        await support.ready();
    });

    describe('index', function () {
        it('should 403 without session', async function () {
            let res = await request.get('/my/messages');
            res.statusCode.should.equal(403);
            res.type.should.equal('text/html');
            res.text.should.containEql('forbidden');
        });

        it('should 200');
    });
});
