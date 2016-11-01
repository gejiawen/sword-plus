var koa = require('koa')
var SwordPlus = require('../index')

var config = {
    logger: {
        folder: './logs'
    },
    router: {
        folder: './routers',
        logger: true,
        cache: false
    },
    pugger: {
        folder: './pugs',
        logger: true,
        cache: false
    },
    connector: {
        // hostname: '172.16.196.32',
        // port: 8090,
        hostname: 'localhost',
        port: 8000,
        logger: true
    }
}

var app = koa()
var sp = new SwordPlus(app, config)

// usage
// this code can merge some extra methods into Clazz
// sp.handler.inject({})

app.use(bodyparser())
sp.logger.config.action && app.use(function *(next) {
    sp.logger.action(this)
    yield next
})

app.use(sp.router.parse())

app.use(function *() {
    sp.logger.info(this.originalUrl)
    this.body = 'ook'
})

app.listen(3000, function() {
    console.log('server at 3000')
})


