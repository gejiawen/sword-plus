/**
 * @file: pugger
 * @author: gejiawen
 * @date: 31/10/2016 18:52
 * @description: pugger
 *
 * Pugger主要用于在服务的渲染Jade/Pug模板
 * 这里的模板属于服务端模板，在渲染的过程中，可通过参数配置是否记录渲染日志。
 * 渲染日志将会记录在渲染过程中的任何报错信息。
 */

var fs = require('fs')
var path = require('path')
var pug = require('pug')
var _ = require('lodash')
var uuid = require('uuid')

var SPError = require('./sword-error')

var DEFAULT_CONFIG = {
    global: {},
    folder: '',
    suffix: '.pug',
    suffixList: ['.pug', '.jade'],
    cache: true,
    logger: false
}

function Pugger(sp, config) {
    this.config = _.extend(DEFAULT_CONFIG, config || {})
    this.sp = sp
    this.cache = {}

    if (!this.config.folder) {
        throw new SPError('LACK_OF_PARAMETER', 'pugger folder is required')
    }

}

function render(route, filePath, data) {
    var cache = this.cache[filePath]

    if (!this.config.cache) {
        cache = null
        delete this.cache[filePath]
    }

    var fields = {
        route: route,
        loggerId: uuid.v4(),
        start: new Date().getTime()
    }

    logger.call(this, 'start', fields)

    if (!cache) {
        var exist = fs.existsSync(filePath)

        if (!exist) {
            throw new SPError('NO_PUG_FILE', 'no template file: ' + filePath)
        } else {
            try {
                cache = this.cache[filePath] = pug.compile(fs.readFileSync(filePath, 'utf8'), {
                    filename: filePath
                })
            } catch (ex) {
                logger.call(this, 'error', fields, ex)
                throw ex
            }
        }
    }

    try {
        var rendered = cache(_.extend(this.config.global, data || {}))
    } catch (ex) {
        logger.call(this, 'error', fields, ex)
        throw ex
    }

    logger.call(this, 'finish', fields)
    return rendered
}

function logger(type, fields, ex) {
    if (!this.config.logger) {
        return
    }

    if (!this.sp.logger) {
        throw new SPError('LACK_OF_PARAMETER', 'logger instance in sword-plus is required')
    }

    fields.type = type.toUpperCase()
    switch (fields.type) {
        case 'START':
            this.sp.logger.render(fields)
            break;
        case 'FINISH':
            fields.finish = new Date().getTime()
            this.sp.logger.render(fields)
            break;
        case 'ERROR':
            fields.finish = new Date().getTime()
            fields.ex = ex
            this.sp.logger.render(fields)
            break;
    }
}

// route here is a pug template file in `this.config.pugFolder`
// your can spec like `index` or `activity/index` or `/any-other-path/index`
// template file suffix is optional, default is `.pug`,
// suffix support list: .pug/.jade
// Pugger.prototype.render = function *(route, data) {
Pugger.prototype.render = function (route, data) {
    if (!route) {
        throw new SPError('LACK_OF_PARAMETER', 'template route is required')
    }

    if (data && typeof data === 'string') {
        throw new SPError('INVALID_OF_PARAMETER', 'data must be a object')
    }

    var pugPath = path.resolve(this.config.folder, route)
    var obj = path.parse(pugPath)

    if (!obj.ext) {
        return render.call(this, route, pugPath + this.config.suffix, data)
    } else if (_.includes(this.config.suffixList, obj.ext)) {
        return render.call(this, route, pugPath, data)
    } else {
        throw new SPError('SUFFIX_NOT_SUPPORT', 'template suffix do not support')
    }
}

/**
 * Expose
 */
module.exports = Pugger
