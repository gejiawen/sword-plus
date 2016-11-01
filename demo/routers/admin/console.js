module.exports = {
    init: function *() {
        return yield this.dispatch()
    },
    doGET: function *() {
        return this.pugger.render('admin/console')
    },
    doPOST: function *() {
        var body = this.app.request.body

        if (body.type === 'vip') {
            return 'have 5 vips'
        }
    }
}
