'use strict';

// const logger = require('../common/logger');

module.exports = (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    done(null, profile);
};
