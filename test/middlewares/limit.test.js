'use strict';

const support         = require('../support/support');
const limitMiddleware = require('../../middlewares/limit');
const app             = require('../../app');
const supertest       = require('supertest')(app);

const visitor         = 'visit' + Date.now();

describe('test/middlewares/limit.test.js', function () {
    before(async function () {
        await support.ready();
    });

    describe('#peripperday', function () {
        it('should visit');
        it('should not visit');
    });
});
