'use strict';

const app             = require('../../app');
const support         = require('../support/support');
const supertest       = require('supertest')(app);
const mm              = require('mm');
const nock            = require('nock');
const should          = require('should');

describe('test/middlewares/proxy.test.js', function () {
    before(async function () {
        await support.ready();
    });

    afterEach(function () {
        mm.restore();
    });

    it('should forbidden google.com', async function () {
        let res = await supertest.get('/agent')
            .query({
                url: 'https://www.google.com.hk/#newwindow=1&q=%E5%85%AD%E5%9B%9B%E4%BA%8B%E4%BB%B6',
            });
        res.text.should.containEql('www.google.com.hk is not allowed');
    });

    it('should allow githubusercontent.com', async function () {
        let url = 'https://avatars.githubusercontent.com/u/1147375?v=3&s=120';

        nock('https://avatars.githubusercontent.com')
            .get('/u/1147375?v=3&s=120')
            .reply(200, 'githubusercontent');

        let res = await supertest.get('/agent')
            .query({
                url: url,
            });
        res.text.should.eql('githubusercontent');
    });

    it('should allow gravatar.com', async function () {
        let url = 'https://gravatar.com/avatar/28d69c69c1c1a040436124238f7cc937?size=48';
        nock('https://gravatar.com')
            .get('/avatar/28d69c69c1c1a040436124238f7cc937?size=48')
            .reply(200, 'gravatar');

        let res = await supertest.get('/agent')
            .query({
                url: url,
            });
        res.text.should.eql('gravatar');
    });

});
