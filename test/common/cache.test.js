'use strict';

const cache  = require('../../common/cache');
const should = require('should');

describe('test/common/cache.test.js', function () {
    it('should set && get', async function () {
        await cache.set('alsotang', {age: 23});
        let data = await cache.get('alsotang');
        data.should.eql({age: 23});
    });

    it('should expire', async function () {
        await cache.set('alsotang', {age: 23}, 1);
        return new Promise((resolve, reject) => {
            setTimeout(async function () {
                let data = await cache.get('alsotang');
                if (data) {
                    reject();
                } else {
                    resolve();
                }
            }, 1.5 * 1000);
        });
    });
});
