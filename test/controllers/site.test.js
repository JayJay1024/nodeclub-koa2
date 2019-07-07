'use strict';
/*!
 * nodeclub - site controller test
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

const app     = require('../../app');
const request = require('supertest')(app);
const should  = require('should');

describe('test/controllers/site.test.js', function () {

    it('should / 200', async function () {
        let res = await request.get('/');
        res.status.should.equal(200);
        res.text.should.containEql('积分榜');
        res.text.should.containEql('友情社区');
    });

    it('should /?page=-1 200', async function () {
        let res = await request.get('/?page=-1')
        res.status.should.equal(200);
        res.text.should.containEql('积分榜');
        res.text.should.containEql('友情社区');
    });

    it('should /sitemap.xml 200', async function () {
        let res = await request.get('/sitemap.xml');
        res.status.should.equal(200);
        res.text.should.containEql('<url>');
    });

    it('should /app/download', async function () {
        let res = await request.get('/app/download');
        res.status.should.equal(302);
    });
});
