var supertest = require('supertest');
var base_url = 'http://localhost:3000';
var server = supertest(base_url);

describe('Root', function() {
    it('should return a welcome message', function(done) {
        server
            .get('/')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.message.should.match(/^Welcome.*/);
                done();
            });
    });
});
