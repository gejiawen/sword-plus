/**
 * @file: server.js
 * @author: gejiawen
 * @date: 31/10/2016 22:41
 * @description: server.js
 */
var koa = require('koa')

var app = koa()

app.use(function *() {
    var url = this.originalUrl

    if (url === '/') {
        this.body = {
            code: 200,
            data: 'index'
        }
    } else if (url === '/user') {
        this.body = {
            code: 200,
            data: 'gk'
        }
    }
})

// app.get('/user', function (req, res) {
//     this.body = 'user page'
// })

app.listen(8000)
