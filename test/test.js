var supertest = require('supertest');
var should = require('chai').should();
var moment = require('moment-timezone')
var base_url = 'http://localhost:3000';
var server = supertest(base_url);

/*
Test the following good routes:
    /
    /hours
    /planets
    /planets/lat/lon
    /planets2
    /planets2/lat/lon
    /planets2/lat/lon/tz
    /planets2/lat/lon/timestamp
    /planets2/lat/lon/timestamp/tz
    /sun
    /sun/lat/lon
    /sun/lat/lon/tz
    /sun2
    /sun2/lat/lon
    /sun2/lat/lon/tz
    /sun2/lat/lon/timestamp
    /sun2/lat/lon/timestamp/tz
    /moon
    /moon/lat/lon
    /moon/lat/lon/tz
    /moon2
    /moon2/lat/lon
    /moon2/lat/lon/tz
    /moon2/lat/lon/timestamp
    /moon2/lat/lon/timestamp/tz
    /whatsup
    /whatsup/lat/lon
    /whatsup/lat/lon/tz
    /whastup/lat/lon/timestamp
    /whatsup/lat/lon/timestamp/tz
    /whatsup/lat/lon/timestamp/timestamp
    /whatsup/lat/lon/timestamp/timestamp/tz
    /whatsup_next
    /whatsup-next
    /weather
    /weather/lat/lon
    /weather/lat/lon/tz
    /forecast
    /forecast/lat/lon
    /forecast/lat/lon/tz
*/
// Set additional test location as Chongquing, China
let lat = 29.55834;
let lon = 106.56667;
// Set additional test info
let tz = 'Asia/Chongqing';
let datetime = '2019-01-01T12:00:00-0600';
//let endtime = '2019-01-01T14:00:00-0600';

describe('Test Valid Endpoints', function() {
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
    describe.skip('Planets 2', function() {
        it('should return planets array at a default location', function(done) {
            this.timeout(10000);
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
            this.timeout(1000);
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
            this.timeout(10000);
            server
                .get(`/planets2/${lat}/${lon}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.be.an('object').that.has.all.keys('query_date', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto');
                    done();
                });
        });
        it('should return planets at a specified location with a given timezone in returned timestamps', function(done) {
            this.timeout(10000);
            server
                .get(`/planets2/${lat}/${lon}/${tz}`)
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
            this.timeout(10000);
            server
                .get(`/planets2/${lat}/${lon}/${datetime}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.query_date.should.equal(datetime);
                    res.body.Mercury.mag.should.equal(-0.31);
                    res.body.Mercury.earth_dist.mi.should.equal(121673488.73993547);
                    res.body.Venus.mag.should.equal(-4.3);
                    res.body.Venus.earth_dist.mi.should.equal(59713010.688672915);
                    res.body.Mars.mag.should.equal(0.49);
                    res.body.Mars.earth_dist.au.should.equal(1.2673511505126953);
                    // TODO: Finish This Section
                    done();
                });
        });
        it('should return planets at a specified location and timestamp with a given timezone in returned timestamps', function(done) {
            this.timeout(10000);
            server
                .get(`/planets2/${lat}/${lon}/${datetime}/${tz}`)
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
    describe('Sun', function() {
        it('should return times of specific altitudes of the sun', function(done) {
            this.timeout(10000);
            server
                .get('/sun')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.times.should.be.an('object').that.has.all.keys('nadir', 'night_end', 'astro_twilight_end', 'sunrise', 'solar_noon', 'sunset', 'astro_twilight_start', 'night_start');
                    done();
                })
        });
        it('should return times of specific altitudes of the sun from a specified location', function(done) {
            this.timeout(10000);
            server
                .get(`/sun/${lat}/${lon}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.times.should.be.an('object').that.has.all.keys('nadir', 'night_end', 'astro_twilight_end', 'sunrise', 'solar_noon', 'sunset', 'astro_twilight_start', 'night_start');
                    done();
                })
        });
        it('should return times of specific altitudes of the sun from a specified location with a given timezone', function(done) {
            this.timeout(10000);
            server
                .get(`/sun/${lat}/${lon}/${tz}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.times.should.be.an('object').that.has.all.keys('nadir', 'night_end', 'astro_twilight_end', 'sunrise', 'solar_noon', 'sunset', 'astro_twilight_start', 'night_start');
                    done();
                });
        });
    });
    describe.skip('Sun 2', function() {
        it('should return specific attributes of the sun', function(done) {
            this.timeout(10000);
            server
                .get('/sun2')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.be.an('object').that.has.all.keys('query_date', 'Sun');
                    res.body.Sun.should.be.an('object').that.has.all.keys('name', 'ra', 'dec', 'size', 'mag', 'elong', 'earth_dist', 'constellation', 'next_solstice', 'next_equinox', 'rise_time', 'rise_az', 'transit_time', 'transit_alt', 'set_time', 'set_az', 'astronomical_dawn', 'nautical_dawn', 'civil_dawn', 'USNO_sunrise', 'USNO_sunset', 'civil_dusk', 'nautical_dusk', 'astronomical_dusk');
                    done();
                })
        });
        it('should return specific attributes of the sun from a specified location', function(done) {
            this.timeout(10000);
            server
                .get(`/sun2/${lat}/${lon}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.should.be.an('object').that.has.all.keys('query_date', 'Sun');
                    res.body.Sun.should.be.an('object').that.has.all.keys('name', 'ra', 'dec', 'size', 'mag', 'elong', 'earth_dist', 'constellation', 'next_solstice', 'next_equinox', 'rise_time', 'rise_az', 'transit_time', 'transit_alt', 'set_time', 'set_az', 'astronomical_dawn', 'nautical_dawn', 'civil_dawn', 'USNO_sunrise', 'USNO_sunset', 'civil_dusk', 'nautical_dusk', 'astronomical_dusk');
                    done();
                })
        })
        it('should return specific attributes of the sun from a specified location with a given timezone', function(done) {
            this.timeout(10000);
            server
                .get(`/sun2/${lat}/${lon}/${tz}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    var pytzformat = moment().tz(tz).format();
                    pytzformat = pytzformat.slice(-6, -3) + pytzformat.slice(-2);
                    //skip equinox and solstice--DST may interfere
                    res.body.query_date.slice(-5).should.equal(pytzformat);
                    res.body.Sun.rise_time.slice(-5).should.equal(pytzformat);
                    res.body.Sun.transit_time.slice(-5).should.equal(pytzformat);
                    res.body.Sun.set_time.slice(-5).should.equal(pytzformat);
                    res.body.Sun.astronomical_dawn.slice(-5).should.equal(pytzformat);
                    res.body.Sun.nautical_dawn.slice(-5).should.equal(pytzformat);
                    res.body.Sun.civil_dawn.slice(-5).should.equal(pytzformat);
                    res.body.Sun.USNO_sunrise.slice(-5).should.equal(pytzformat);
                    res.body.Sun.USNO_sunset.slice(-5).should.equal(pytzformat);
                    res.body.Sun.civil_dusk.slice(-5).should.equal(pytzformat);
                    res.body.Sun.nautical_dusk.slice(-5).should.equal(pytzformat);
                    res.body.Sun.astronomical_dusk.slice(-5).should.equal(pytzformat);
                    done();
                })
        })
        it('should return specific attributes of the sun from a specified location from a particular timestamp', function(done) {
            this.timeout(10000);
            server
                .get(`/sun2/${lat}/${lon}/${datetime}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.Sun.earth_dist.km.should.equal(147106590.41330904);
                    res.body.Sun.dec.should.equal(-22.978245640268263);
                    res.body.Sun.size.should.equal(1951.7640380859375);
                    done();
                })
        })
        it('should return specific attributes of the sun from a specified location from a particular timestamp with a given timezone', function(done) {
            this.timeout(10000);
            server
                .get(`/sun2/${lat}/${lon}/${datetime}/${tz}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    res.body.Sun.next_solstice.should.equal("2019-06-21T23:54:21+0800")
                    res.body.Sun.next_equinox.should.equal("2019-03-21T05:58:31+0800")
                    done();
                })
        })
    });
    describe('Moon', function() {});
    describe('Moon 2', function() {});
    describe('What\'s Up', function() {});
    describe('What\'s Up Next', function() {});
    describe('Weather', function() {});
    describe('Forecast', function() {});
});
/*
Test the following good routes:
    /sun2/lat/lon/timestamp
    /sun2/lat/lon/timestamp/tz
    /moon
    /moon/lat/lon
    /moon/lat/lon/tz
    /moon2
    /moon2/lat/lon
    /moon2/lat/lon/tz
    /moon2/lat/lon/timestamp
    /moon2/lat/lon/timestamp/tz
    /whatsup
    /whatsup/lat/lon
    /whatsup/lat/lon/tz
    /whastup/lat/lon/timestamp
    /whatsup/lat/lon/timestamp/tz
    /whatsup/lat/lon/timestamp/timestamp
    /whatsup/lat/lon/timestamp/timestamp/tz
    /whatsup_next
    /whatsup-next
    /weather
    /weather/lat/lon
    /weather/lat/lon/tz
    /forecast
    /forecast/lat/lon
    /forecast/lat/lon/tz
*/
/*
Test some improper routes:
    /blah
    /abc/
    /whatsup/lat
    /moon2/lon
    /moon/tz
    /sun2/timestamp
    /sun/tz
    /planets2/timestamp
    /planets/lat/lon/tz
*/