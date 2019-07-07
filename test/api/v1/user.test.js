'use strict';

const app     = require('../../../app');
const request = require('supertest')(app);
const support = require('../../support/support');
const should  = require('should');

describe('test/api/v1/user.test.js', function () {

    let mockUser;

    before(async function () {
        if (await support.ready()) {
            mockUser = await support.createUser();
        }
    });

    describe('get /api/v1/user/:loginname', function () {

            it('should return user info', async function () {
                let res = await request.get('/api/v1/user/' + mockUser.loginname);
                res.body.success.should.true();
                res.body.data.loginname.should.equal(mockUser.loginname);
            });

            it('should fail when user is not found', async function () {
                let res = await request.get('/api/v1/user/' + mockUser.loginname + 'not_found');
                res.status.should.equal(404);
                res.body.success.should.false();
            });
      });
});
