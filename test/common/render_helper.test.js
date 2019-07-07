'use strict';

const support      = require('../support/support');
const renderHelper = require('../../common/render_helper');
const app          = require('../../app');
const request      = require('supertest')(app);
const mm           = require('mm');
const should       = require('should');
const _            = require('lodash');
const pedding      = require('pedding');
const stripIndent  = require('strip-indent');

describe('test/common/render_helper.test.js', function () {
    describe('#markdown', function () {
        it('should render code inline', function () {
            let text = `\`var a = 1;\``
            let rendered = renderHelper.markdown(text);
            rendered.should.equal('<div class="markdown-text"><p><code>var a = 1;</code></p>\n</div>');
        });

        it('should render fence', function () {
            let text = `
                \`\`\`js
                var a = 1;
                \`\`\`
            `;
            text = stripIndent(text);
            let rendered = renderHelper.markdown(text);
            rendered.should.equal('<div class=\"markdown-text\"><pre class=\"prettyprint language-js\"><code>var a = 1;\n</code></pre></div>');
        });

        it('should render code block', function () {
            let text =
`
    var a = 1;
`;
            let rendered = renderHelper.markdown(text);
            rendered.should.equal('<div class="markdown-text"><pre class="prettyprint"><code>var a = 1;\n</code></pre></div>');
        });
    });

    describe('#escapeSignature', function () {
        it('should escape content', function () {
            let signature =
`我爱北京天安门<script>alert(1)
</script>`;
            let escaped = renderHelper.escapeSignature(signature);
            escaped.should.equal('我爱北京天安门&lt;script&gt;alert(1)<br>&lt;/script&gt;');
        });
    });

    describe('#tabName', function () {
        it('should translate', function () {
            renderHelper.tabName('share')
                .should.equal('分享');
        });
    });

});
