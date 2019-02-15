var supertest = require('supertest')
var BaseUrl = 'http://localhost:3000'
var server = supertest(BaseUrl)

describe('Forecast', function () {
  this.timeout(0)
  it('should return forecast object', function (done) {
    server
      .get('/forecast')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        res.body.should.be.an('object').that.has.all.keys('cnt', 'list', 'dt', 'city')
        done()
      })
  })
})
