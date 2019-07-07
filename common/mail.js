'use strict';

const config        = require('../config');
const mailer        = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const util          = require('util');
const logger        = require('../common/logger');

const transporter   = mailer.createTransport(smtpTransport(config.mail_opts));
const SITE_ROOT_URL = `http://${config.app_host}`;

/**
 * Send an email
 * @param {Object} data 邮件对象
 */
const sendMail = async (data) => {
    if (config.debug) {
        // return;
    }

    // 重试5次
    for (let i = 0; i < 5; i++) {
        try {
            let info = await transporter.sendMail(data);
            logger.info('send mail success:', info);
            return;
        } catch (err) {
            logger.error('send mail error:\n', err);
        }
    }
};
exports.sendMail = sendMail;

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendActiveMail = (who, token, name) => {
    let from    = util.format(`${config.name} <${config.mail_opts.auth.user}>`);
    let to      = who;
    let subject = `${config.name}社区帐号激活`;
    let html    = `<p>您好：${name}</p>
    <p>我们收到您在${config.name}社区的注册信息，请点击下面的链接来激活账户：</p>
    <a href=${SITE_ROOT_URL}/active_account?key=${token}&name=${name}>激活链接</a>
    <p>若您没有在${config.name}社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对您造成的打扰感到抱歉。</p>
    <p>${config.name}社区 谨上。</p>`;

    this.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

/**
 * 发送密码重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendResetPassMail = (who, token, name) => {
    let from    = util.format(`${config.name} <${config.mail_opts.auth.user}>`);
    let to      = who;
    let subject = config.name + '社区密码重置';
    let html    = `<p>您好：${name}</p>
      <p>我们收到您在${config.name}社区重置密码的请求，请在24小时内单击下面的链接来重置密码：</p>
      <a href="${SITE_ROOT_URL}/reset_pass?key=${token}&name=${name}">重置密码链接</a>
      <p>若您没有在${config.name}社区填写过注册信息，说明有人滥用了您的电子邮箱，请删除此邮件，我们对给您造成的打扰感到抱歉。</p>
      <p>${config.name}社区 谨上。</p>`;

    this.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};
