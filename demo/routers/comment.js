module.exports = {
    init: function *() {
        return yield this.dispatch()
    },
    doGET: function *() {
        return this.pugger.render('comment')
    },
    doPOST: function *() {
        // TODO
        var body = this.app.request.body

        return 'i love you, ' + body.name
    }
}
