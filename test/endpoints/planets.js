var supertest = require('supertest');
var base_url = 'http://localhost:3000';
var server = supertest(base_url);

// Set additional test location as Chongquing, China
let lat = 29.55834;
let lon = 106.56667;

describe('Planets', function() {
    it('should return planets array at a default location', function(done) {
        server
            .get('/planets')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                if (res.body) {
                    res.body.should.be.an('array');
                    res.body.forEach(element => {
                        element.name.should.match(/Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto/)
                    });
                }
                done();
            });
    });
    it('should return planets array at a specified location', function(done) {
        server
            .get(`/planets/${lat}/${lon}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                if (res.body) {
                    res.body.should.be.an('array');
                    res.body.forEach(element => {
                        element.name.should.match(/Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto/)
                    });
                }
                done();
            });
    });
});
