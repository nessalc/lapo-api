var supertest = require('supertest');
var base_url = 'http://localhost:3000';
var moment = require('moment-timezone')
var server = supertest(base_url);

// Set additional test location as Chongquing, China
let lat = 29.55834;
let lon = 106.56667;
// Set additional test info
let tz = 'Asia/Chongqing';
let datetime = '2019-01-01T12:00:00-0600';

describe('Moon 2', function() {
    this.timeout(0);
    it('should return specific attributes of the moon', function(done) {
        server
            .get('/moon2')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.an('object').that.has.all.keys('query_date', 'Moon');
                res.body.Moon.should.be.an('object').that.has.all.keys('name', 'ra', 'dec', 'size', 'mag', 'elong', 'earth_dist', 'constellation', 'sun_dist', 'phase','illuminated_surface','phase_name','next_new_moon','next_first_quarter','next_full_moon','next_last_quarter','rise_time','rise_az','transit_time','transit_alt','set_time','set_az');
                done();
            })
    });
    it('should return specific attributes of the moon from a specified location', function(done) {
        server
            .get(`/moon2/${lat}/${lon}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.an('object').that.has.all.keys('query_date', 'Moon');
                res.body.Moon.should.be.an('object').that.has.all.keys('name', 'ra', 'dec', 'size', 'mag', 'elong', 'earth_dist', 'constellation', 'sun_dist', 'phase','illuminated_surface','phase_name','next_new_moon','next_first_quarter','next_full_moon','next_last_quarter','rise_time','rise_az','transit_time','transit_alt','set_time','set_az');
                done();
            })
    })
    it('should return specific attributes of the moon from a specified location with a given timezone', function(done) {
        server
            .get(`/moon2/${lat}/${lon}/${tz}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                var pytzformat = moment().tz(tz).format();
                pytzformat = pytzformat.slice(-6, -3) + pytzformat.slice(-2);
                //skip phases--DST may interfere
                res.body.query_date.slice(-5).should.equal(pytzformat);
                res.body.Moon.rise_time.slice(-5).should.equal(pytzformat);
                res.body.Moon.transit_time.slice(-5).should.equal(pytzformat);
                res.body.Moon.set_time.slice(-5).should.equal(pytzformat);
                done();
            })
    })
    it('should return specific attributes of the moon from a specified location from a particular timestamp', function(done) {
        server
            .get(`/moon2/${lat}/${lon}/${datetime}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.Moon.earth_dist.km.should.equal(392903.4259353072);
                res.body.Moon.dec.should.equal(-14.030068531851162);
                res.body.Moon.size.should.equal(1826.9219970703125);
                res.body.Moon.sun_dist.mi.should.equal(91530028.02815835);
                done();
            })
    })
    it('should return specific attributes of the moon from a specified location from a particular timestamp with a given timezone', function(done) {
        this.timeout(10000);
        server
            .get(`/moon2/${lat}/${lon}/${datetime}/${tz}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.Moon.next_new_moon.should.equal("2019-01-06T09:28:11+0800")
                res.body.Moon.next_full_moon.should.equal("2019-01-21T13:16:04+0800")
                done();
            })
    })
});
