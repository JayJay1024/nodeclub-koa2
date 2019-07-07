'use strict';

const config  = require('../config'),
      utility = require('utility'),
      path    = require('path'),
      fs      = require('fs');

/**
 * 借助koa-body，fileOrig为ctx.request.files.xxx
 */
exports.upload = (fileOrig) => {
    let newFilename     = utility.md5(fileOrig.name + String((new Date()).getTime())) + path.extname(fileOrig.name);
    let newFilenameUrl  = path.join(config.upload.url, newFilename);
    let newFilenamePath = path.join(config.upload.path, newFilename);

    let fileReader = fs.createReadStream(fileOrig.path);
    let fileWriter = fs.createWriteStream(newFilenamePath);
    fileReader.pipe(fileWriter);

    return {url: newFilenameUrl};
};
