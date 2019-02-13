var supertest = require('supertest');
var base_url = 'http://localhost:3000';
var server = supertest(base_url);

describe('Hours', function() {
    it('should return hours object', function(done) {
        server
            .get('/hours')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.hours.should.be.an('object').that.has.all.keys('prettyHours', 'open', 'close');
                done();
            });
    });
})
