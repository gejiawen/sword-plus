/**
 * @file: index
 * @author: gejiawen
 * @date: 31/10/2016 15:08
 * @description: index
 */

// var util = require('util')

// var Core = require('./lib/core')
var Logger = require('./lib/logger')
var Router = require('./lib/router')
var Handler = require('./lib/handler')
var Connector = require('./lib/connector')
var Pugger = require('./lib/pugger')

var VERSION = '1.0.0'

function SwordPlus(koa, config) {
    this.version = VERSION

    this.koa = koa

    this.logger = new Logger(this, config.logger)
    this.router = new Router(this, config.router)
    this.handler = new Handler(this, config.handler)
    this.pugger = new Pugger(this, config.pugger)
    this.connector = new Connector(this, config.connector)

}

// util.inherits(SwordPlus, Core)
module.exports = SwordPlus
