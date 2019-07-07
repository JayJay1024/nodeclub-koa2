'use strict';
/*!
 * nodeclub - rss controller test
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

const app     = require('../../app');
const config  = require('../../config');
const request = require('supertest');
const should  = require('should');

describe('test/controllers/rss.test.js', function () {

    describe('/rss', function () {
        it('should return `application/xml` Content-Type', async function () {
            let res = await request(app).get('/rss');
            res.status.should.equal(200);
            res.headers.should.property('content-type', 'application/xml');
            res.text.indexOf('<?xml version="1.0" encoding="utf-8"?>').should.equal(0);
            res.text.should.containEql('<rss version="2.0">');
            res.text.should.containEql('<channel><title>' + config.rss.title + '</title>');
        });

        describe('mock `config.rss` not set', function () {
            let rss = config.rss;
            before(function () {
                config.rss = null;
            });
            after(function () {
                config.rss = rss;
            });

            it('should return waring message', async function () {
                let res = await request(app).get('/rss');
                res.status.should.equal(404);
                res.text.should.equal('Please set `rss` in config.js');
            });
        });

        describe('mock `topic.getTopicsByQuery()` error', function () {
            it('should return error');
        });
    });
});
