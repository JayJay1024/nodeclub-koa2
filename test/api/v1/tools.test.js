'use strict';

const app     = require('../../../app');
const request = require('supertest')(app);
const support = require('../../support/support');
const should  = require('should');

describe('test/api/v1/tools.test.js', function () {

    let mockUser;

    before(async function () {
        if (await support.ready()) {
            mockUser = await support.createUser();
        }
    });

    it('should response with loginname', async function () {
        let res = await request
            .post('/api/v1/accesstoken')
            .send({
                accesstoken: mockUser.accessToken
            });
        res.status.should.equal(200);
        res.body.success.should.true();
        res.body.loginname.should.equal(mockUser.loginname);
        res.body.id.should.equal(mockUser.id);
    });

    it('should 401 when accessToken is wrong', async function () {
        let res = await request
            .post('/api/v1/accesstoken')
            .send({
                accesstoken: 'not_exists'
            });
        res.status.should.equal(401);
        res.body.success.should.false();
    });
});
