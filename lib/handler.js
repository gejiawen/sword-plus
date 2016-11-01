/**
 * @file: handler
 * @author: gejiawen
 * @date: 31/10/2016 20:15
 * @description: handler
 *
 * Handler是业务类模型的顶层抽象。
 * 所有经过Router解析之后，都会通过Handler来派生出具体的业务类，以便在Router.provider中使用。
 * 在Handler中可以使用内部扩展或者外部拓展(Handler.extend)，来增加所有业务类即可使用的功能方法。
 *
 * 此外，Handler中对几个套件的实例对象做了转发，使得在具体的业务类中可以使用他们
 */
var util = require('util')
var _ = require('lodash')


var DEFAULT_CONFIG = {
    // TODO
}

function Handler(sp, config) {
    this.config = _.extend(DEFAULT_CONFIG, config)
    this.sp = sp
}


Handler.prototype.extend = function(except) {
    // TODO
}

Handler.prototype.dispatch = function *() {
    // `this` here reference Clazz
    var method = this.app.request.method
    return yield this['do' + method]()
}

Handler.prototype.inherits = function(exp) {
    var self = this

    function Clazz(app) {
        this.app = app
        this.logger = self.sp.logger
        this.connector = self.sp.connector
        this.connector.app = app
        this.pugger = self.sp.pugger
    }

    Clazz.prototype = _.extend(Clazz.prototype, exp)

    util.inherits(Clazz, Handler)

    return Clazz
}

/**
 * Expose
 */
module.exports = Handler
