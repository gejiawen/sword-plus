/**
 * @file: router
 * @author: gejiawen
 * @date: 31/10/2016 19:52
 * @description: Route
 *
 * Router用于解析koa的包装后的请求
 * 其中有两个主要方式，
 * - parse，用于解析路由
 * - provider，用于聚合业务类，并启动与对应路由匹配的业务逻辑
 *
 * 所有的业务类默认的启动方法都名为`init()`
 */

var url = require('url')
var path = require('path')
var _ = require('lodash')

var SPError = require('./sword-error')

var DEFAULT_CONFIG = {
    folder: '',
    routerMap: {
        '/': 'index'
    },
    cache: true,
    logger: true,
    '404': '/404.html',
    '500': '/500.html'
}

function Router(sp, config) {
    this.config = _.extend(DEFAULT_CONFIG, config || {})
    this.sp = sp
    this.cache = {}
    this.url = ''

    if (!this.config.folder) {
        throw new SPError('LACK_OF_PARAMETER', 'route folder is required')
    }
}

// 解析访问url中hostname之后的路由，这里的访问url是koa app给的，`/`, `/index.html`, `/user/info.html` 等形式，
// 解析后将会得到 `/`, `/index`, `/user/info`，此即为程序的route
// 所有的route都相对 this.config.folder 去匹配
// 若在 this.config.cache 中优先匹配到路由处理器，则采用 this.config.cache[route] 中的配置
// 否则会在 this.config.folder 路径下匹配同名的路由处理器

Router.prototype.parse = function () {
    var self = this
    return function *(next) {
        var obj = url.parse(this.originalUrl)
        var pathname = obj.pathname
        if (/\..+$/.test(pathname) && pathname.replace(/.*(\..+)$/, '$1') !== '.html') {
            if (self.config.logger) {
                self.sp.logger.warn('nodejs layout do NOT support file server except `.html` request')
            }
            // this.body = 'file server do not support'
            return
        }

        self.route = this.originalUrl
        self.method = this.request.method
        try {
            var body = yield self.provider(this, this.originalUrl)
            if (_.isUndefined(body) && self.method === 'POST') {
                this.body = ''
                throw new SPError('POST_RETURN_UNDEFINED', 'post method need a return value')
            } else {
                this.body = body || ''
            }
        } catch (ex) {
            if (self.config.logger) {
                self.sp.logger.fatal(ex)
            }
            this.body = ''

            if (ex.name !== 'SwordError') {
                ex.code = ex.code ? ex.code.toUpperCase() : '500'
                ex = new SPError(ex.code, ex.message)
            }

            // 这是临时的做法，后面考虑引入koa-router之类的路由管控中间件
            // 在Router暂存错误信息
            self.ex = ex

            // MODULE_NOT_FOUND 意为没有找到相关的router，handler，pug文件，此时从含以上更加符合404
            // 其他的错误类型，更多的是nodejs层在操作具体业务时，比如调用接口，逻辑判断，等等操作产生的错误，此时从含义上更加符合500
            switch(ex.type.toString()) {
                case 'POST_RETURN_UNDEFINED':
                    _.noop()
                    break;
                case 'MODULE_NOT_FOUND':
                    this.redirect(self.config['404'])
                    break;
                case '404':
                case 'TIMEOUT':
                default:
                    this.redirect(self.config['500'])
                    break;
            }
        }
    }
}

Router.prototype.provider = function *(app, route) {
    // 在Node服务之前会有nginx层，对请求路径进行监控，最终转发到node层的必定都是以`.html`为后缀的请求
    // 这些请求本质上都是具体的业务逻辑请求

    if (route !== '/' && !/\..+$/.test(route)) {
        throw new SPError('SUFFIX_IS_REQUIRED', 'route suffix is required')
    }

    var routeName = route === '/' ? this.config.routerMap['/'] : route.replace(/[\\|\/](.*)\..*$/, '$1')
    var cacheKey = '/' + routeName
    var filePath = path.resolve(this.config.folder, routeName) + '.js'
    var cache = this.cache[cacheKey]

    if (!this.config.cache) {
        cache = null
        delete this.cache[cacheKey]
        delete require.cache[filePath]
    }

    if (!cache) {
        try {
            var glue = require(filePath)
            // 缓存中应该仅仅存储业务类，而不是业务实例。
            // 因为在创建业务实例时需要传入koa app，不同时刻的koa请求，其koa app是不一样的。
            cache = this.cache[cacheKey] = this.sp.handler.inherits(glue)
        } catch (ex) {
            throw ex
        }
    }

    // 所有的route业务逻辑被实例化后，都是调用统一的`init`方法
    return yield new cache(app).init()
}

/**
 * Expose
 */
module.exports = Router



