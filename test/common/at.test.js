'use strict';

const support     = require('../support/support');
const at          = require('../../common/at');
const message     = require('../../common/message');
const mm          = require('mm');
const should      = require('should');
const stripIndent = require('strip-indent');

describe('test/common/at.test.js', function () {
    let testTopic, normalUser, normalUser2, adminUser;

    let text = `
        @A-aZ-z0-9_
        @中文
        @begin_with_spaces @multi_in_oneline
        Text More Text @around_text ![Pic](/public/images/cnode_icon_32.png)
        @end_with_no_space中文
        Text 中文@begin_with_no_spaces
        @end_with_no_space2@begin_with_no_spaces2

        jysperm@gmail.com @alsotang

        @alsotang2


        \`\`\`
        呵呵 \`\`\`
        @alsotang3
        \`\`\`

        \`\`\`js
        @flow
        \`\`\`

        \`\`\`@alsotang4\`\`\`

        @
        @@

        \`@code_begin_with_no_space\`
        code: \`@in_code\`

            @in_pre

        \`\`\`
        @in_oneline_pre
        \`\`\`

        \`\`\`
        Some Code
        Code @in_multi_line_pre
        \`\`\`

        [@be_link](/user/be_link) [@be_link2](/user/be_link2)

        @alsotang @alsotang
        aldjf
        @alsotang @tangzhanli

        [@alsotang](/user/alsotang)

        @liveinjs 没事儿，能力和热情更重要，北京雍和宫，想的就邮件给我i5ting@126.com
    `;
    text = stripIndent(text);

    let matched_users = ['A-aZ-z0-9_', 'begin_with_spaces',
        'multi_in_oneline', 'around_text', 'end_with_no_space',
        'begin_with_no_spaces', 'end_with_no_space2',
        'begin_with_no_spaces2', 'alsotang', 'alsotang2',
        'tangzhanli', 'liveinjs'];

    let linkedText = `
        [@A-aZ-z0-9_](/user/A-aZ-z0-9_)
        @中文
        [@begin_with_spaces](/user/begin_with_spaces) [@multi_in_oneline](/user/multi_in_oneline)
        Text More Text [@around_text](/user/around_text) ![Pic](/public/images/cnode_icon_32.png)
        [@end_with_no_space](/user/end_with_no_space)中文
        Text 中文[@begin_with_no_spaces](/user/begin_with_no_spaces)
        [@end_with_no_space2](/user/end_with_no_space2)[@begin_with_no_spaces2](/user/begin_with_no_spaces2)

        jysperm@gmail.com [@alsotang](/user/alsotang)

        [@alsotang2](/user/alsotang2)


        \`\`\`
        呵呵 \`\`\`
        @alsotang3
        \`\`\`

        \`\`\`js
        @flow
        \`\`\`

        \`\`\`@alsotang4\`\`\`

        @
        @@

        \`@code_begin_with_no_space\`
        code: \`@in_code\`

            @in_pre

        \`\`\`
        @in_oneline_pre
        \`\`\`

        \`\`\`
        Some Code
        Code @in_multi_line_pre
        \`\`\`

        [@be_link](/user/be_link) [@be_link2](/user/be_link2)

        [@alsotang](/user/alsotang) [@alsotang](/user/alsotang)
        aldjf
        [@alsotang](/user/alsotang) [@tangzhanli](/user/tangzhanli)

        [@alsotang](/user/alsotang)

        [@liveinjs](/user/liveinjs) 没事儿，能力和热情更重要，北京雍和宫，想的就邮件给我i5ting@126.com
    `;
    linkedText = stripIndent(linkedText);

    before(async function () {
        if (await support.ready()) {
            testTopic   = support.testTopic;
            normalUser  = support.normalUser;
            normalUser2 = support.normalUser2;
            adminUser   = support.adminUser;
        }
    });

    afterEach(function () {
        mm.restore();
    });

    describe('#fetchUsers()', function () {
        let fetchUsers = at.fetchUsers;
        it('should found 6 users', function () {
            let users = fetchUsers(text);
            should.exist(users);
            users.should.eql(matched_users);
        });

        it('should found 0 user in text', function () {
            let users = fetchUsers('no users match in text @ @@@@ @ @@@ @哈哈 @ testuser1');
            users.should.length(0);
        });
    });

    describe('#linkUsers()', function () {
        it('should link all mention users', function () {
            let text2 = at.linkUsers(text);
            text2.should.equal(linkedText);
        });
    });

    describe('sendMessageToMentionUsers()', function () {
        it('should send message to all mention users', async function () {
            let atUserIds = [String(adminUser._id), String(normalUser2._id)];

            mm(message, 'sendAtMessage', function (atUserId, authorId, topicId, replyId) {
                atUserIds.indexOf(String(atUserId)).should.not.equal(-1);
            });

            let text = '@' + adminUser.loginname + ' @' + normalUser2.loginname + ' @notexitstuser 你们好';
            return await at.sendMessageToMentionUsers(text, testTopic._id, normalUser._id);
        });

        it('should not send message to no mention users', async function () {
            await at.sendMessageToMentionUsers('abc no mentions', testTopic._id, normalUser._id);
        });

        it('should not send at msg to author', async function () {
            await at.sendMessageToMentionUsers('@' + normalUser.loginname + ' hello', testTopic._id, normalUser._id);
        });

        describe('mock message.sendAtMessage() error', function () {
            beforeEach(function () {
                mm(message, 'sendAtMessage', function (atUserId, authorId, topicId, replyId) {
                    return new Promise((resolve, reject) => {
                        process.nextTick(function () {
                            reject(new Error('mock sendAtMessage() error'));
                        })
                    });
                });
            });
            it('should return error', async function () {
                let text = '@' + normalUser.loginname + ' @' + normalUser2.loginname + ' @notexitstuser 你们好';
                try {
                    await at.sendMessageToMentionUsers(text, testTopic._id, normalUser._id);
                } catch (err) {
                    should.exist(err);
                    err.message.should.equal('mock sendAtMessage() error');
                    return;
                }
                throw new Error('test fail');
            });
        });

    });
});
