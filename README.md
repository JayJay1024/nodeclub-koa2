# nodeclub-koa2

### 说明
`nodeclub-koa2`是基于[`nodeclub`](https://github.com/cnodejs/nodeclub/)的`koa2`实现，欢迎大家提`Issue/PR`。

`nodeclub`是`express`框架的，`nodeclub-koa2`除了框架不一样之外，还有一些其他的修改:

- 替换由于框架差异的`npm pkg`;
- 去除/替换一些比较老旧的`npm pkg`;
- 去除`EventProxy`、`Callback`异步编程的写法;
- 使用`Promise`、`async/await`等语法(发现改过之后很多写法确实精简很多);
- 替换`art-template`模板引擎(原来的`ejs-mate`不支持`koa2`晕，不过现在这个除了没有母版页，速度还是很快的);
- 原来的`multiline`提示废弃了，改为使用模板字符串;
- 使用`koa-body`支持文件上传下传;
- ...

### 下载安装
```
^_^ ~ $: git clone https://github.com/LucienLau/nodeclub-koa2.git
^_^ ~ $: cd nodeclub-koa2 && npm install
```

### 测试
把`config.js`中`debug`置为`true`，然后`^_^ ~ $: npm test`

### 启动
`^_^ ~ $: npm start`

### Note
使用前需要安装并启动`mongo`和`redis`数据库
