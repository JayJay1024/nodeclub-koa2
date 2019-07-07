'use strict';

const github  = require('../../controllers/github');
const User    = require('../../models').User;
const config  = require('../../config');
const support = require('../support/support');
const app     = require('../../app');
const request = require('supertest')(app);
const mm      = require('mm');
const should  = require('should');


describe('test/controllers/github.test.js', function () {
    before(async function () {
        await support.ready()
    });

    afterEach(function () {
        mm.restore();
    });

    it('should 302 when get /auth/github', async function () {
        let _clientID = config.GITHUB_OAUTH.clientID;
        config.GITHUB_OAUTH.clientID = 'aldskfjo2i34j2o3';
        let res = await request.get('/auth/github');
        res.status.should.equal(302);
        res.headers.should.have.property('location')
            .with.startWith('https://github.com/login/oauth/authorize?');
        config.GITHUB_OAUTH.clientID = _clientID;
    });

    describe('get /auth/github/callback', function () {
        it('should redirect to /auth/github/new when the github id not in database');
        it('should redirect to / when the user is registed');
    });

    describe('get /auth/github/new', function () {
        it('should 200', async function () {
            let res = await request.get('/auth/github/new');
            res.status.should.equal(200);
            res.text.should.containEql('/auth/github/create');
        });
    });

    describe('post /auth/github/create', function () {
        it('should create a new user');
        it('should not create a new user when loginname or email conflict');
        it('should link a old user');
    });
});
