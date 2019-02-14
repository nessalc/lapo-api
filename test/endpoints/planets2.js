var supertest = require('supertest');
var should = require('chai').should();
var moment = require('moment-timezone')
var base_url = 'http://localhost:3000';
var server = supertest(base_url);

// Set additional test location as Chongquing, China
let lat = 29.55834;
let lon = 106.56667;
// Set additional test info
let tz = 'Asia/Chongqing';
let datetime = '2019-01-01T12:00:00-0600';

describe('Planets 2', function() {
    this.timeout(0);
    it('should return planets array at a default location', function(done) {
        server
            .get('/planets2')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.an('object').that.has.all.keys('query_date', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto');
                done();
            });
    });
    it('should return planets array at a default location faster', function(done) {
        this.timeout(500);
        server
            .get('/planets2')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.an('object').that.has.all.keys('query_date', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto');
                done();
            });
    });
    it('should return planets array at a specified location', function(done) {
        server
            .get(`/planets2/?lat=${lat}&lon=${lon}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.an('object').that.has.all.keys('query_date', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto');
                done();
            });
    });
    it('should return planets at a specified location with a given timezone in returned timestamps', function(done) {
        server
            .get(`/planets2/?lat=${lat}&lon=${lon}&tz=${tz}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                var pytzformat = moment().tz(tz).format();
                pytzformat = pytzformat.slice(-6, -3) + pytzformat.slice(-2);
                res.body.query_date.slice(-5).should.equal(pytzformat);
                delete(res.body.query_date)
                for (var key in res.body) {
                    if (res.body.hasOwnProperty(key)) {
                        element = res.body[key]
                        element.rise_time.slice(-5).should.equal(pytzformat);
                        element.transit_time.slice(-5).should.equal(pytzformat);
                        element.set_time.slice(-5).should.equal(pytzformat);
                    }
                }
                done();
            });
    });
    it('should return planets at a specified location and timestamp', function(done) {
        server
            .get(`/planets2?lat=${lat}&lon=${lon}&dt=${datetime}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.query_date.should.equal(datetime);
                //TODO: figure out an appropriate range of values to verify accuracy
                done();
            });
    });
    it('should return planets at a specified location and timestamp with a given timezone in returned timestamps', function(done) {
        server
            .get(`/planets2/?lat=${lat}&lon=${lon}&dt=${datetime}&tz=${tz}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                var pytzformat = moment().tz(tz).format();
                pytzformat = pytzformat.slice(-6, -3) + pytzformat.slice(-2);
                res.body.query_date.slice(-5).should.equal(pytzformat);
                delete(res.body.query_date)
                for (var key in res.body) {
                    if (res.body.hasOwnProperty(key)) {
                        element = res.body[key]
                        element.rise_time.slice(-5).should.equal(pytzformat);
                        element.transit_time.slice(-5).should.equal(pytzformat);
                        element.set_time.slice(-5).should.equal(pytzformat);
                    }
                }
                done();
            });
    });
});
