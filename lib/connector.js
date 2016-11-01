/**
 * @file: connector
 * @author: gejiawen
 * @date: 31/10/2016 19:18
 * @description: connector
 *
 * Connector封装了node->rest层，UI层->node层的请求操作。
 * 内部使用了node-fetch。
 *
 */

var url = require('url')
var querystring = require('querystring')
var _ = require('lodash')
var fetch = require('node-fetch')
var uuid = require('uuid')

var SPError = require('./sword-error')

var DEFAULT_CONFIG = {
    hostname: '',
    port: 80,
    timeout: 5e3,
    logger: false
}

function Connector(sp, config) {
    this.config = _.extend(DEFAULT_CONFIG, config || {})
    this.sp = sp

    if (!this.config.hostname || !this.config.port) {
        throw new SPError('LACK_OF_PARAMETER', 'hostname and port are both required')
    }
}

// `opts` here will merge into headers
// some custom header field you can supported when fetch
function *cnt(method, url, bump, opts) {
    if (!url || (url && typeof url !== 'string')) {
        throw new SPError('LACK_OF_PARAMETER', 'url is required')
    }

    if (bump && typeof bump !== 'object') {
        throw new SPError('INVALID_OF_PARAMETER', 'query object or post data must be a object')
    }

    var fetchUrl = getFetchUrl.call(this, method, url, bump, opts)
    var fetchOptions = getFetchOptions.call(this, method, bump, opts)

     logger.call(this, 'request', fetchUrl, fetchOptions)

    try {
        var res = yield fetch(fetchUrl, fetchOptions)
        var status = res.status
        var statusText = res.statusText

        if (status === 200) {
            var json = yield res.json()

            logger.call(this, 'response', fetchUrl, fetchOptions, {
                status: status,
                statusText: statusText,
                json: json
            })

            return json
        } else {
            throw new SPError(status.toString().toUpperCase(), statusText)
            // ex.status = status
            // ex.statusText = statusText + ' at: ' + fetchUrl
        }

    } catch (ex) {
        if (ex.type === 'request-timeout') {
            ex = new SPError('TIMEOUT', 'network timeout')
        }

        logger.call(this, 'error', fetchUrl, fetchOptions, ex)

        throw ex
    }
}

function logger(type, uri, options, bump) {
    if (!this.config.logger) {
        return
    }

    if (!this.sp.logger) {
        throw new SPError('LACK_OF_PARAMETER', 'logger instance in sword-plus is required')
    }

    switch (type) {
        case 'request':
            this.sp.logger.request({
                url: uri,
                method: options.method,
                body: options.body || '',
                headers: _.extend(options.headers, {
                    'x-start-time': new Date().getTime()
                })
            })
            break;
        case 'response':
            this.sp.logger.response({
                url: uri,
                method: options.method,
                body: options.body || '',
                headers: _.extend(options.headers, {
                    'x-finish-time': new Date().getTime(),
                }),
                bump: bump
            })
            break;
        case 'error':
            this.sp.logger.response({
                url: uri,
                method: options.method,
                body: options.body || '',
                headers: _.extend(options.headers, {
                    'x-finish-time': new Date().getTime(),
                }),
                bump: bump,
                ex: true
            })
            break;
    }
}

function getFetchUrl(method, uri, bump, opts) {
    if (!method) {
        throw new SPError('LACK_OF_PARAMETER', 'method is required')
    }

    var obj = url.parse(uri)
    var source = {}
    obj.protocol && (source.protocol = obj.protocol)
    obj.hostname && (source.hostname = obj.hostname)
    obj.port && (source.port = obj.port)
    obj.pathname && (source.pathname = obj.pathname)
    obj = _.extend({
        hostname: this.config.hostname,
        port: this.config.port
    }, source, opts || {})

    obj.protocol = obj.port === 443 ? 'https:' : 'http:'

    if (method === 'GET') {
        return obj.protocol + '//' + obj.hostname + ':' + obj.port + obj.pathname + getQueryString(bump)
    } else if (method === 'POST') {
        return obj.protocol + '//' + obj.hostname + ':' + obj.port + obj.pathname
    }
}

function getQueryString(query) {
    if (!query) {
        return ''
    }

    var str = ''
    var sep = '?'

    _.forEach(query, function (v, k) {
        str += sep + k + '=' + v
        sep = '&'
    })

    return str
}

function getFetchOptions(method, bump, opts) {
    if (!method) {
        throw new SPError('LACK_OF_PARAMETER', 'method is required')
    }

    if (!this.app) {
        throw new SPError('LACK_OF_PARAMETER', 'koa instance is required, this.app will be assign in sword plus')
    }

    var options = {
        method: method,
        headers: _.extend({}, this.app.accept.headers, {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-logger-id': uuid.v4()
        }),
        credentials: 'includes',
        timeout: this.config.timeout
    }

    if (method === 'POST' && bump) {
        options.body = getDataString(bump)
    }

    return options
}

function getDataString(data) {
    return querystring.stringify(data)
}

Connector.prototype.get = function (url, query, opts) {
    return cnt.call(this, 'GET', url, query, opts)
}

Connector.prototype.post = function (url, data, opts) {
    return cnt.call(this, 'POST', url, data, opts)
}


module.exports = Connector
