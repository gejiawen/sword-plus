# sword-plus [![NPM version](https://badge.fury.io/js/sword-plus.svg)](https://npmjs.org/package/sword-plus) [![Build Status](https://travis-ci.org/gejiawen/sword-plus.svg?branch=master)](https://travis-ci.org/gejiawen/sword-plus)

> Based on koa, provide convenience for the middle layer development of a series of functional suite.

sword-plus是一系列工具集合，基于koa程序，提供了日志记录、模板渲染、请求访问、路由支持、业务类抽象等功能。

它的定位并不是大而全的开发框架，而是一个提升NodeJS程序开发效率的工具箱，以及常用功能的提炼。其内部的各个功能组件存在一定程度上的偶合。

## Installation

```sh
$ npm install --save sword-plus
```

## Usage

See demo folder for more detail.

## Document

Here is a [blog]() for sword-plus. You can enjoy it.

### `sword-plus.js`

SwordPlus的Error封装。用于统一分配error。

目前SwordPlus Error的type有如下几种，

- LACK_OF_PARAMETER
- INVALID_OF_PARAMETER
- 404
- ERROR_OF_MAKEDIR
- SUFFIX_NOT_SUPPORT
- SUFFIX_IS_REQUIRED
- TIMEOUT
- MODULE_NOT_FOUND
- NO_TEMPLATE_FILE

### `Router`

Router用于解析koa的包装后的请求。

其中有两个主要方式，
- `parse`，用于解析路由
- `provider`，用于聚合业务类，并启动与对应路由匹配的业务逻辑

`DEFAULT_CONFIG`,

```js
var DEFAULT_CONFIG = {
    folder: '',         // 路由目录
    routerMap: {        // 默认的路由配置表
        '/': 'index'
    },
    cache: true,        // 是否应用缓存，这里缓存的对象为具体的业务类，而不是业务类实例
    logger: true,       // 是否记录日志
    '404': '/404.html', // 默认的404页面
    '500': '/500.html'  // 默认的500页面
}
```

### `Pugger`

Pugger主要用于在服务的渲染Jade/Pug模板

- 这里的模板属于服务端模板，在渲染的过程中，可通过参数配置是否记录渲染日志。
- 渲染日志将会记录在渲染过程中的任何报错信息。

`DEFAULT_CONFIG`,

```js
var DEFAULT_CONFIG = {
    global: {},             // 渲染时额外填充的全局数据
    folder: '',             // 模板目录
    suffix: '.pug',         // 默认的模板文件后缀
    suffixList: ['.pug', '.jade'],  // 支持的模板文件后缀
    cache: true,            // 是否应用缓存，这里缓存的对象为compile过的模板内容
    logger: true           // 是否记录日志
}
```

### `Logger`

Logger将所有的日志分为如下几大类（category），

- fatal、error、warn、info
- request、response、render、action

其中第一行的6种其实是bunyan自带日志等级的alias，第二行是根据不同业务场景抽象出来的。

- request，Nodejs程序向rest服务器发送rest api请求的日志
- response，rest服务器返回给Nodejs程序的rest api响应的日志
- render，服务端模板的渲染日志，这里所谓的渲染日志其实是跟客户端（浏览器）是没有关系的，它仅仅表示模板文件和数据的组装和编译过程
- action，所有由用户发起从而产生的交互日志，包括页面请求、表单提交、客户端ajax请求等等

每一条日志都是一个record抽象，每个record实例在category的维度下，还会有level的区分，常用的level有如下几种

- info
- warn
- error

`DEFAULT_CONFIG`,

```js
var DEFAULT_CONFIG = {
    folder: '',                     // 写日志目录
    slice: true,                    // 是否分割日志，默认按天
    prefix: 'sp-logger',            // 日志文件名前缀
    suffix: '.log',                 // 日志文件后缀
    name: 'sp-logger-20161101+0800',    // 日志record对象的名称
    src: false,                     // 是否记录源文件代码行信息    
    saveInterval: false, // 6e4     // 是否按照某一周期写日志
    saveBuffer: false, // 100       // 是否按照某一buffer缓冲写日志
    durationLimit: 3e3, // 5e3      // request和response日志类型的耗时限制
    reqDetail: true,                // 是否记录request日志类型的详情
    resDetail: true,                // 是否记录response日志类型的详情
    action: true,                   // 是否启用交互日志类型记录    
    actDetail: true,                // 是否记录action日志类型的详情
    localTime: true                 // 是否使用本地时区时间
}
```

### `Handler`

Handler是业务类模型的顶层抽象。

所有经过Router解析之后，都会通过Handler来派生出具体的业务类，以便在Router.provider中使用。
在Handler中可以使用内部扩展或者外部拓展(Handler.inject)，来增加所有业务类即可使用的功能方法。

此外，Handler中对几个套件的实例对象做了转发，使得在具体的业务类中可以使用他们。

Handler中提供如下几个方法，

- `inherits`，在Router解析完毕之后，在Router.provider中通过此方法生成具体的业务类Clazz。
- `dispatch`，在业务类中对get和post请求进行转发。
- `inject`，在server启动时，可以根据需要注入外部拓展，一旦注入，则在所有生成的业务类中都可使用。

### `Connector`

Connector封装了node->rest层，UI层->node层的请求操作。内部使用了node-fetch。

允许在操作请求时，记录请求日志。

```js
var DEFAULT_CONFIG = {
    hostname: '',   // rest服务的hostname
    port: 80,       // rest服务的port
    timeout: 5e3,   // 请求timeout市场限制
    logger: true    // 是否记录请求日志
}
```

## License

MIT © [gejiawen](http://blog.gejiawen.com/)
