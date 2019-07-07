'use strict';

const config           = require('../../config');
const configMiddleware = require('../../middlewares/conf');
const UserProxy        = require('../../proxy/user');
const mailService      = require('../../common/mail');
const tools            = require('../../common/tools');
const app              = require('../../app');
const request          = require('supertest')(app);
const should           = require('should');
const pedding          = require('pedding');
const utility          = require('utility');
const passport         = require('passport');
const mm               = require('mm');

describe('test/controllers/sign.test.js', function () {
    let now       = +new Date();
    let loginname = 'testuser' + now;
    let email     = 'testuser' + now + '@gmail.com';
    let pass      = 'wtffffffffffff';

    afterEach(function () {
        mm.restore();
    });

    describe('sign up', function () {

        it('should visit sign up page', async function () {
            let res = await request.get('/signup');
            res.status.should.equal(200);
            res.text.should.containEql('确认密码');
        });

        it('should redirect to github oauth page');

        it('should sign up a user', async function () {
            mm(mailService, 'sendMail', function (data) {
                data.to.should.match(new RegExp(loginname + '@gmail\\.com'));
            });

            let res = await request.post('/signup')
                .send({
                    loginname: loginname,
                    email: email,
                    pass: pass,
                    re_pass: pass,
                });
            res.status.should.equal(200);
            res.text.should.containEql('欢迎加入');

            let user = await UserProxy.getUserByLoginName(loginname);
            user.should.ok();
        });

        it('should not sign up a user when loginname is exists', async function () {
            let res = await request.post('/signup')
                .send({
                    loginname: loginname,
                    email: email + '1',
                    pass: pass,
                    re_pass: pass,
                });
            res.status.should.equal(422);
        });

        it('should not sign up a user when email is exists', async function () {
            let res = await request.post('/signup')
                .send({
                    loginname: loginname + '1',
                    email: email,
                    pass: pass,
                    re_pass: pass,
                });
            res.status.should.equal(422);
        });
    });

    describe('login in', function () {
        it('should visit sign in page', async function () {
            let res = await request.get('/signin');
            res.text.should.containEql('登录');
            res.text.should.containEql('通过 GitHub 登录');
        });

        it('should error when no loginname or no pass', async function () {
            let res = await request.post('/signin')
                .send({
                    name: loginname,
                    pass: '',
                });
            res.status.should.equal(422);
            res.text.should.containEql('信息不完整。');
        });

        it('should not login in when not actived', async function () {
            let res = await request.post('/signin')
                .send({
                    name: loginname,
                    pass: pass,
                });
            res.status.should.equal(403);
            res.text.should.containEql('此帐号还没有被激活，激活链接已发送到');
        });
    });

    describe('sign out', function () {
        it('should sign out', async function () {
            let res = await request.post('/signout')
                .set('Cookie', config.auth_cookie_name + ':something;');
            res.status.should.equal(302);
            `${config.auth_cookie_name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly`.should.be.equalOneOf(res.headers['set-cookie']);
        });
    });

    describe('active', function () {
        it('should active account', async function () {
            let user = await UserProxy.getUserByLoginName(loginname);
            let key = utility.md5(user.email + user.pass + config.session_secret);
            let res = await request.get('/active_account')
                .query({
                    key: key,
                    name: loginname,
                });
            res.status.should.equal(200);
            res.text.should.containEql('账号已被激活，请登录');
        });
    });

    describe('when new user is actived', function () {
        it('should login in successful', async function () {
            let res = await request.post('/signin')
                .send({
                    name: loginname,
                    pass: pass,
                });
            res.status.should.equal(302);
            res.headers.location.should.equal('/');
        });
    });

    describe('search pass', function () {
        let resetKey;

        it('should 200 when get /search_pass', async function () {
            let res = await request.get('/search_pass');
            res.status.should.equal(200);
            res.text.should.containEql('找回密码');
        });

        it('should update search pass', async function () {
            mm(mailService, 'sendMail', function (data) {
                data.from.should.containEql(`<${config.mail_opts.auth.user}>`);
                data.to.should.match(new RegExp(loginname));
                data.subject.should.equal('Nodeclub社区密码重置');
                data.html.should.match(new RegExp('<p>您好：' + loginname));
                resetKey = data.html.match(/key=(.+?)&/)[1];
            });

            let res = await request.post('/search_pass')
                .send({
                    email: email
                });
            res.status.should.equal(200);
            res.text.should.containEql('我们已给您填写的电子邮箱发送了一封邮件，请在24小时内点击里面的链接来重置密码。');
        });

        it('should 200 when get /reset_pass', async function () {
            let res = await request.get('/reset_pass')
                .query({
                    key : resetKey,
                    name : loginname
                });
            res.status.should.equal(200);
            res.text.should.containEql('重置密码');
        });

        it('should 403 get /reset_pass when with wrong resetKey', async function () {
            let res = await request.get('/reset_pass')
                .query({
                    key : 'wrong key',
                    name : loginname
                });
            res.status.should.equal(403);
            res.text.should.containEql('信息有误，密码无法重置。');
        });

        it('should update passwork', async function () {
            let res = await request.post('/reset_pass')
                .send({
                    psw: 'jkljkljkl',
                    repsw: 'jkljkljkl',
                    key: resetKey,
                    name: loginname,
                });
            res.status.should.equal(200);
            res.text.should.containEql('你的密码已重置。');
        });
    });
});
