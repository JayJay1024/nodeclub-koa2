'use strict';

const should  = require('should');
const request = require('supertest');
const app     = require('../app');
const config  = require('../config');

describe('test/app.test.js', function () {
    it('should / status 200', function (done) {
        request(app)
            .get('/')
            .end((err, res) => {
                if (err) {
                    done(err);
                }
                res.status.should.equal(200);
                res.text.should.containEql(config.description);
                done();
            });
    });
});
