/**
 * @file: logger
 * @author: gejiawen
 * @date: 31/10/2016 15:46
 * @description: logger
 *
 * logger将所有的日志分为如下几大类（category），
 *
 * fatal、error、warn、info、trace、debug
 * request、response、render、action
 *
 * 其中第一行的6种其实是bunyan自带日志等级的alias，
 * 第二行是根据不同业务场景抽象出来的。
 *
 * - request，Nodejs程序向rest服务器发送rest api请求的日志
 * - response，rest服务器返回给Nodejs程序的rest api响应的日志
 * - render，服务端模板的渲染日志，这里所谓的渲染日志其实是跟客户端（浏览器）是没有关系的，它仅仅表示模板文件和数据的组装和编译过程
 * - action，所有由用户发起从而产生的交互日志，包括页面请求、表单提交、客户端ajax请求等等
 *
 * 每一条日志都是一个record抽象，每个record实例在category的维度下，还会有level的区分，
 * 常用的level有如下几种
 * - info
 * - warn
 * - error
 */
var fs = require('fs')
var path = require('path')
var util = require('util')
var querystring = require('querystring')
var bunyan = require('bunyan')
var uuid = require('uuid')
var onFinished = require('on-finished')
var _ = require('lodash')
var moment = require('moment')

// var Core = require('./core')
var SPError = require('./sword-error')

var DEFAULT_CONFIG = {
    folder: '',
    slice: true,
    prefix: 'sp-logger',
    suffix: '.log',
    name: 'sp-logger-' + getCurrentDateString(),
    src: false,
    saveInterval: false, // 6e4
    saveBuffer: false, // 100
    durationLimit: 3e3, // 5e3
    reqDetail: true,
    resDetail: true,
    action: true,
    actDetail: true
}

var START = 'START'
var FINISH = 'FINISH'
var ERROR = 'ERROR'
var TIMEOUT = 'TIMEOUT'


function getCurrentDateString() {
    return moment().format('YYYY-MM-DD HH:mmZZ').replace(/^(\d+)-(\d+)-(\d+) (.+)([+-]\d+)$/, '$1$2$3$5')
}
function parseLevel(status, duration) {
    if (status >= 400) {
        return 'error'
    } else if (typeof status === 'string' && _.includes(['TIMEOUT', 'MODULE_NOT_FOUND'], status)) {
        return 'error'
    } else {
        if (this.config.durationLimit && duration > this.config.durationLimit) {
            return 'warn'
        }
        return 'info'
    }
}

function Logger(sp, config) {
    this.config = _.extend(DEFAULT_CONFIG, config || {})
    this.sp = sp
    this.section = getCurrentDateString()

    // TODO
    // this.cache = []

    if (!this.config.folder) {
        throw new SPError('LACK_OF_PARAMETER', 'log folder is required')
    }

    this.bunyan = getBunyan.call(this)
}

function getBunyan() {
    return bunyan.createLogger({
        name: this.config.name,
        src: this.config.src,
        streams: [
            {
                type: 'file',
                path: detectFolder.call(this)
            }
        ],
        serializers: {
            request: reqSer(),
            response: resSer(),
            // render:
            action: actSer(),
            postData: postDataSer(),
            renderError: renderErrorSer(),
            actionError: actionErrorSer(),
            err: bunyan.stdSerializers.err
        }
    })
}

function detectFolder() {
    var folderPath = path.resolve(this.config.folder)

    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath)
        } catch (ex) {
            throw new SPError('ERROR_OF_MAKEDIR', 'make log folder failed: ' + ex.message)
        }
    }

    var fileName = this.config.prefix + (this.config.slice ? '-' + this.section : '') + this.config.suffix
    return path.resolve(folderPath, fileName)
}
function reqSer() {
    return function(ctx) {
        return {
            method: ctx.method,
            url: ctx.url,
            headers: ctx.headers
        }
    }
}
function resSer() {
    return function(ctx) {
        if (ctx.ex) {
            return (ctx.bump.status || ctx.bump.type) + ' ' + (ctx.bump.statusText || ctx.bump.message)
        } else {
            try {
                return JSON.stringify(ctx.bump.json)
            } catch (ex) {
                return ex
            }
        }
    }
}
function actSer() {
    return function(ctx) {
        var req = ctx.request.req
        var res = ctx.response.res

        if (!res.finished) {
            if (!req || !req.connection) {
                return req
            }
            return {
                method: req.method,
                url: req.url,
                headers: req.headers,
                remoteAddress: req.connection.remoteAddress,
                remotePort: req.connection.remotePort
            }
        } else {
            if (!res || !res.statusCode) {
                return res
            }
            return {
                statusCode: res.statusCode,
                header: res._header
            }
        }
    }
}
function postDataSer() {
    return function(ctx) {
        // return querystring.parse(ctx)
        return ctx
    }
}
function renderErrorSer() {
    return function(ctx) {
        return {
            path: ctx.path,
            message: ctx.message
        }
    }
}
function actionErrorSer() {
    return function(ctx) {
        // TODO
    }
}
function saveByInterval() {
    // TODO
}
function saveByBuffer() {
    // TODO
}
function clearCache() {
    // TODO
}


function cacheRecord(record) {
    // TODO
    // saveInterval 与 saveBuffer 同一时刻只能启用一种，这里需要互斥判断
    if (this.config.saveInterval) {
        // TODO
    } else if (this.config.saveBuffer) {
        // TODO
    } else {
        saveRecord.call(this, record)
    }
}
function saveRecord(record) {
    // TODO here is ugly, need refine
    // 检测每次写日志时，是否本地时间跨天，若跨天则会将改变logger instance的输出文件地址
    // TODO 当启用缓存写日志时，一旦检测到前后的日志记录跨天，那么应该立马将现有的cache写入日志
    if (this.config.slice && (this.section !== getCurrentDateString())) {
        this.bunyan = getBunyan.call(this)
    }

    var level = record.level
    var category = record.category
    var field = record.field
    var value = record.value
    var message = record.message
    var fields = {}

    fields.category = category

    if (_.includes(['request', 'response', 'render', 'action'], category)) {
        fields[field] = value

        switch (category) {
            case 'request':
                saveRequestRecord.call(this, fields)
                break
            case 'response':
                saveResponseRecord.call(this, fields)
                break
            case 'render':
                saveRenderRecord.call(this, fields)
                break;
            case 'action':
                saveActionRecord.call(this, fields)
        }
    } else {
        this.bunyan[level](fields, message)
    }
}

function saveRequestRecord(fields) {
    var ctx = fields['request']
    var headers = ctx.headers
    var fmtReqMsg = function () {
        return util.format('%s %s', ctx.method, ctx.url)
    }

    fields = _.extend(fields, {
        label: START,
        loggerId: headers['x-logger-id'],
        method: ctx.method
        // url: ctx.url
    })

    if (ctx.method.toUpperCase() === 'POST') {
        fields.postData = ctx.body
    }
    if (!this.config.reqDetail) {
        delete fields.request
    }

    this.bunyan.info(fields, fmtReqMsg())
}
function saveResponseRecord(fields) {
    var ctx = fields['response']
    var headers = ctx.headers
    var bump = ctx.bump
    var duration = headers['x-finish-time'] - headers['x-start-time']
    var level = parseLevel.call(this, bump.type, duration)
    var fmtResMsg = function () {
        return util.format('%s %s %s %s %dms', ctx.method, ctx.url, bump.status || bump.type, bump.statusText || bump.message, duration)
    }

    fields = _.extend(fields, {
        label: FINISH,
        loggerId: headers['x-logger-id'],
        method: ctx.method,
        duration: duration,
        // url: ctx.url,
        // status: bump.status,
        // statusText: bump.statusText
    })

    // if (ctx.method.toUpperCase() === 'POST') {
    //     fields.postData = ctx.body
    // }
    if (!this.config.resDetail) {
        delete fields.response
    }

    this.bunyan[level](fields, fmtResMsg())
}
function saveRenderRecord(fields) {
    var ctx = fields['render']
    var loggerId = ctx.loggerId
    var type = ctx.type
    var route = ctx.route
    var ex = ctx.ex
    var level = parseLevel.call(this, type)
    var fmtRenderMsg = function () {
        if (type === START) {
            return util.format('RENDER %s %s', obj.route, type)
        } else {
            return util.format('RENDER %s %s %dms', obj.route, type, ctx.finish - ctx.start)
        }
    }

    var obj = {
        category: fields.category,
        label: type === START ? START : FINISH,
        loggerId: loggerId,
        route: /^\/\.+/.test(route) ? route : '/' + route // `activity/index` => `/activity/index`
    }

    if (type !== START) {
        obj.duration = ctx.finish - ctx.start
    }

    if (type === ERROR) {
        obj.renderError = ex
    }

    this.bunyan[level](obj, fmtRenderMsg())
}
function saveActionRecord(fields) {
    var self = this
    var ctx = fields['action']
    var startTime = new Date().getTime()
    var level
    var duration
    ctx.req.loggerId = uuid.v4()
    var fmtReqMsg = function () {
        return util.format('%s %s', ctx.req.method, ctx.req.headers.host + ctx.req.url)
    }
    var fmtResMsg = function () {
        return util.format('%s %s %d %dms', ctx.req.method, ctx.req.headers.host + ctx.req.url, ctx.status, duration)
    }
    var onResFinished = function () {
        duration = new Date().getTime() - startTime
        level = parseLevel.call(self, ctx.status, duration)
        fields.label = FINISH
        fields.status = ctx.status
        fields.duration = duration
        fields.loggerId = ctx.req.loggerId
        fields.method = ctx.req.method
        self.bunyan[level](fields, fmtResMsg())
    }

    if (!this.config.actDetail) {
        delete fields.action
    }
    if (ctx.req.method.toUpperCase() === 'POST') {
        fields.postData = ctx.request.body //|| 'need use `bodyparser` middleware before sword-logger' // here need app.use(bodyparser()) firstly.
    }

    fields.label = START
    fields.loggerId = ctx.req.loggerId
    fields.method = ctx.req.method

    this.bunyan.info(fields, fmtReqMsg())
    onFinished(ctx.response.res, onResFinished)
}

function wrapper(category) {
    switch (category) {
        case 'fatal':
        case 'error':
        case 'warn':
        case 'info':
        case 'debug':
        case 'trace':
            return function (message) {
                cacheRecord.call(this, {
                    category: category,
                    level: category,
                    message: message
                })
            }
            break
        case 'template':
        case 'request':
        case 'response':
        case 'render':
        case 'action':
            return function (field) {
                cacheRecord.call(this, {
                    category: category,
                    field: category,
                    value: field
                })
            }
            break
    }
}

Logger.prototype.fatal = wrapper('fatal')
Logger.prototype.error = wrapper('error')
Logger.prototype.warn = wrapper('warn')
Logger.prototype.info = wrapper('info')
// Logger.prototype.debug = wrapper('debug')
// Logger.prototype.trace = wrapper('trace')
Logger.prototype.request = wrapper('request')
Logger.prototype.response = wrapper('response')
Logger.prototype.render = wrapper('render')
Logger.prototype.action = wrapper('action')
// Logger.prototype.action = function () {
//
//     return function *() {
//         wrapper('action')
//     }
// }

/**
 * Expose
 */
module.exports = Logger
