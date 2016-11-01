module.exports = {
    init: function *() {
        var rst = yield this.connector.get('/user')
        return this.pugger.render('about', rst)
    }
}
