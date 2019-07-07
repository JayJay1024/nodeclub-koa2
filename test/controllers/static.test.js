'use strict';

const app     = require('../../app');
const request = require('supertest')(app);
const should  = require('should');

describe('test/controllers/static.test.js', function () {
    it('should get /about', async function () {
        let res = await request.get('/about').expect(200);
        res.text.should.containEql('CNode 社区由一批热爱 Node.js 技术的工程师发起');
    });

    it('should get /faq', async function () {
        let res = await request.get('/faq').expect(200);
        res.text.should.containEql('CNode 社区和 Node Club 是什么关系？');
    });

    it('should get /getstart', async function () {
        let res = await request.get('/getstart').expect(200);
        res.text.should.containEql('Node.js 新手入门');
    });

    it('should get /robots.txt', async function () {
        let res = await request.get('/robots.txt').expect(200);
        res.text.should.containEql('User-Agent');
    });
});
