'use strict';

const support = require('../support/support');
const store   = require('../../common/store');
const app     = require('../../app');
const request = require('supertest')(app);
const pedding = require('pedding');
const should  = require('should');
const mm      = require('mm');

describe('test/controllers/topic.test.js', function () {

    before(async function () {
        await support.ready();
    });

    afterEach(function () {
        mm.restore();
    });

    describe('#index', function () {
        it('should get /topic/:tid 200', async function () {
            let res = await request.get('/topic/' + support.testTopic._id).expect(200);
            res.text.should.containEql('test topic content');
        });

        it('should get /topic/:tid 200 when login in');
    });

    describe('#create', function () {
        it('should show a create page');
    });

    describe('#put', function () {
        it('should not create a topic when no title');

        it('should not create a topic when no tab');

        it('should not create a topic when no content');

        it('should create a topic');
    });

    describe('#showEdit', function () {
        it('should show a edit page');
    });

    describe('#update', function () {
        it('should update a topic');
    });

    describe('#delete', function () {
        let wouldBeDeleteTopic;
        before(async function () {
            wouldBeDeleteTopic = await support.createTopic(support.normalUser._id);
        });

        it('should not delete a topic when not author');

        it('should delele a topic');
    });

    describe('#top', function () {
        it('should top a topic');

        it('should untop a topic');
    });

    describe('#good', function () {
        it('should good a topic');

        it('should ungood a topic');
    });

    describe('#collect', function () {
        it('should collect a topic');

        it('should not collect a topic twice');
    });

    describe('#de_collect', function () {
        it('should decollect a topic');

        it('should not decollect a non-exist topic_collect');
    });

    describe('#upload', function () {
        it('should upload a file');
    });

    describe('#lock', function () {
        it('should lock a topic');

        it('should not reply a locked topic');

        it('should unlock a topic');

        it('should reply a unlocked topic');
    });
});
