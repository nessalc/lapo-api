require('dotenv').config();
const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const suncalc = require('suncalc');
const moment = require('moment-timezone');
const viewingSchedule = require('../lib/viewingSchedule');
const {
  getPlanetEphem,
} = require('../lib/astropical');
const {
  getEvents,
} = require('../lib/events');
const helpers = require('../lib/helpers');

/* home page. */
router.get('/', function(req, res, next) {
  const response = {
    message: 'Welcome to the Lake Afton Public Observatory API! To contribute, visit https://github.com/openwichita/lake-afton-api',
  };
  res.json(response);
});

router.get('/hours', function(req, res, next) {
  const currentTime = new Date();
  const month = currentTime.getMonth() + 1;
  const response = {
    hours: {
      prettyHours: '',
      open: '',
      close: '',
    },
  };
  switch (month) {
    case 3:
    case 4:
      response.hours.prettyHours = '8:30pm - 10:30pm';
      response.hours.open = '8:30pm';
      response.hours.close = '10:30pm';
      break;
    case 5:
    case 6:
    case 7:
    case 8:
      response.hours.prettyHours = '9:00pm - 11:30pm';
      response.hours.open = '9:00pm';
      response.hours.close = '11:30pm';
      break;
    case 9:
    case 10:
      response.hours.prettyHours = '8:30pm - 10:30pm';
      response.hours.open = '8:30pm';
      response.hours.close = '10:30pm';
      break;
    case 11:
    case 12:
    case 1:
    case 2:
      response.hours.prettyHours = '7:30pm - 9:30pm';
      response.hours.open = '7:30pm';
      response.hours.close = '9:30pm';
      break;
  }
  res.json(response);
});

/* planets */
router.get('/planets', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const fiveMinutes = 5 * 60 * 60 * 1000;
  const data = await getPlanetEphem(lat, lon, fiveMinutes);
  // now we have the data
  const planets = data.response;
  if (planets !== undefined) {
    const visiblePlanets = [];

    planets.forEach(function(planet) {
      if (planet.alt > 0) {
        let brightness = '';
        if (planet.mag > 6.5) {
          brightness = 'not visible to naked eye';
        } else if (planet.mag >= 2) {
          brightness = 'dim';
        } else if (planet.mag >= 1) {
          brightness = 'average';
        } else if (planet.mag >= 0) {
          brightness = 'bright';
        } else if (planet.mag >= -3) {
          brightness = 'very bright';
        } else {
          brightness = 'extremely bright';
        }

        const prettyPlanetStruct = {
          name: planet.name,
          altitudeDegrees: planet.alt,
          distanceFromEarthAU: planet.au_earth,
          distanceFromEarthMiles: planet.au_earth * 149597870700 / 1609.344,
          magnitude: planet.mag,
          brightness: brightness,
          constellation: planet.const,
        };

        visiblePlanets.push(prettyPlanetStruct);
      }
    });
    res.json(visiblePlanets);
  } else {
    res.json(data);
  }
});
router.get('/planets2', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const date = moment(req.query.dt).format();
  const key = process.env.OpenWeatherMapAPIKey;
  const elev = await helpers.getElevation(lat,
      lon,
      process.env.GooglePlacesAPIKey);
  const weatherData = await helpers.getWeather(lat, lon, key);
  const pressure = weatherData.main.pressure;
  const temp = weatherData.main.temp.celsius;
  const data = {
    lat: lat,
    lon: lon,
    elev: elev,
    tz: tz,
    body: [
      'mercury',
      'venus',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
    ],
    pressure: pressure,
    temp: temp,
  };
  if (req.query.dt) {
    data.date = date;
  }
  const result = await helpers.pythonCall(data);
  res.json(result);
});

/* sun */
router.get('/sun', function(req, res, next) {
  const currentTime = new Date();
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const response = {
    times: {
      nadir: '',
      night_end: '',
      astro_twilight_end: '',
      sunrise: '',
      solar_noon: '',
      sunset: '',
      astro_twilight_start: '',
      night_start: '',
    },
  };
  const times = suncalc.getTimes(currentTime, lat, lon);
  /* Populate JSON construct */
  /* Future: check if current time is later than displayed time; update
     to next day's time if this is the case */
  response.times.nadir = moment(times.nadir).tz(tz)
      .format('h:mma z');
  response.times.night_end = moment(times.nightEnd).tz(tz)
      .format('h:mma z');
  response.times.astro_twilight_end = moment(times.nauticalDawn)
      .tz(tz).format('h:mma z');
  response.times.sunrise = moment(times.sunrise).tz(tz)
      .format('h:mma z');
  response.times.solar_noon = moment(times.solarNoon).tz(tz)
      .format('h:mma z');
  response.times.sunset = moment(times.sunset).tz(tz)
      .format('h:mma z');
  response.times.astro_twilight_start = moment(times.nauticalDusk).tz(tz)
      .format('h:mma z');
  response.times.night_start = moment(times.night).tz(tz)
      .format('h:mma z');
  res.json(response);
});
router.get('/sun2', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const date = moment(req.query.dt).format();
  const key = process.env.OpenWeatherMapAPIKey;
  const elev = await helpers.getElevation(lat,
      lon,
      process.env.GooglePlacesAPIKey);
  const weatherData = await helpers.getWeather(lat, lon, key);
  const pressure = weatherData.main.pressure;
  const temp = weatherData.main.temp.celsius;
  const data = {
    lat: lat,
    lon: lon,
    elev: elev,
    tz: tz,
    body: [
      'sun',
    ],
    pressure: pressure,
    temp: temp,
  };
  if (req.query.dt) {
    data.date = date;
  }
  const result = await helpers.pythonCall(data);
  res.json(result);
});

/* moon */
router.get('/moon', function(req, res, next) {
  const currentTime = new Date();
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const lazy = 0.03;
  const response = {
    moonrise: '',
    phase: '',
    moonset: '',
    illumination: 0,
  };
  const times = suncalc.getMoonTimes(currentTime, lat, lon);
  const illum = suncalc.getMoonIllumination(currentTime);
  /* Populate JSON construct */
  /* Future: check if current time is later than displayed time; update
     to next day's time if this is the case */
  response.moonrise = moment(times.rise).tz(tz).format('h:mma z');
  response.moonset = moment(times.set).tz(tz).format('h:mma z');
  response.illumination = (illum.fraction * 100).toPrecision(4)
    + ' %'; // percent illumnation
  // get phase in common terms
  if ((illum.phase >= (1 - lazy)) || (illum.phase <= (0 + lazy))) {
    response.phase = 'New Moon';
  } else if (illum.phase < (0.25 - lazy)) {
    response.phase = 'Waxing Crescent';
  } else if ((illum.phase >= (0.25 - lazy)) && (illum.phase <= (0.25 + lazy))) {
    response.phase = 'First Quarter';
  } else if (illum.phase < (0.5 - lazy)) {
    response.phase = 'Waxing Gibbous';
  } else if ((illum.phase >= (0.5 - lazy)) && (illum.phase <= (0.5 + lazy))) {
    response.phase = 'Full Moon';
  } else if (illum.phase < (0.75 - lazy)) {
    response.phase = 'Waning Gibbous';
  } else if ((illum.phase >= (0.75 - lazy)) && (illum.phase <= (0.75 + lazy))) {
    response.phase = 'Last Quarter';
  } else if (illum.phase < (1 - lazy)) {
    response.phase = 'Waning Crescent';
  } else {
    response.phase = 'Green Cheese?';
  }
  res.json(response);
});
router.get('/moon2', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const date = moment(req.query.dt).format();
  const key = process.env.OpenWeatherMapAPIKey;
  const elev = await helpers.getElevation(lat,
      lon,
      process.env.GooglePlacesAPIKey);
  const weatherData = await helpers.getWeather(lat, lon, key);
  const pressure = weatherData.main.pressure;
  const temp = weatherData.main.temp.celsius;
  const data = {
    lat: lat,
    lon: lon,
    elev: elev,
    tz: tz,
    body: [
      'moon',
    ],
    pressure: pressure,
    temp: temp,
  };
  if (req.query.dt) {
    data.date = date;
  }
  const result = await helpers.pythonCall(data);
  res.json(result);
});

/* events */
router.get('/events', async function(req, res, next) {
  const key = process.env.GoogleCalendarAPIKey;
  const calendarId = process.env.GoogleCalendarId;
  const fiveMinutes = 5 * 60 * 60 * 1000;
  const data = await getEvents(calendarId, key, fiveMinutes);

  const events = data.items;
  const eventsForDisplay = [];

  events.forEach(function(event) {
    const startDate = new Date(event.start.dateTime).toString();
    const endDate = new Date(event.end.dateTime).toString();
    const eventStruct = {
      summary: event.summary,
      description: event.description,
      startTime: startDate,
      endTime: endDate,
      location: event.location,
    };
    eventsForDisplay.push(eventStruct);
  });

  res.json(eventsForDisplay);
});

/* schedule */
router.get('/schedule', function(req, res, next) {
  // get the date of the upcoming Sunday, then subtract two days to get the
  // relevant Friday. The schedules are made for "fridays" but they apply for
  // both Friday and Saturday, so if someone requests the schedule on
  // Saturday, we need to get the schedule that's made for "yesterday" but
  // if they request on a Thursday, we need to get it for "tomorrow" -- so
  // we use the next Sunday, minus two days to get that. Math'd.

  // the schedule lives in /lib/viewingSchedule and is manually generated
  // with by minions

  const upcomingSunday = new Date();
  upcomingSunday.setDate(upcomingSunday.getDate()
    + (0 + 7 - upcomingSunday.getDay()) % 7);
  // let upcomingSundayFormatted = moment(upcomingSunday).format('MM-DD-YYYY');
  const relevantFriday = moment(upcomingSunday).subtract(2, 'days');
  const relevantFridayFormatted = moment(relevantFriday).format('MM-DD-YYYY');

  const response = {
    schedule: viewingSchedule[relevantFridayFormatted],
  };

  res.json(response);
});

/* what's up */
router.get('/whatsup', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const start = moment(req.query.start).format();
  let end = moment(req.query.end).format();
  const key = process.env.OpenWeatherMapAPIKey;
  const elev = await helpers.getElevation(lat,
      lon,
      process.env.GooglePlacesAPIKey);
  if (moment(start) > moment(end)) {
    end = start;
  }
  const weatherData = await helpers.getWeather(lat, lon, key);
  const pressure = weatherData.main.pressure;
  const temp = weatherData.main.temp.celsius;
  const data = {
    lat: lat,
    lon: lon,
    elev: elev,
    tz: tz,
    mag: 6,
    pressure: pressure,
    temp: temp,
  };
  if (req.query.start) {
    data.date = start;
  }
  if (req.query.end) {
    data.end = end;
  }
  const result = await helpers.pythonCall(data);
  res.json(result);
});
/*
This is specific to LAPO, so no fancy stuff
*/
router.get(/whatsup[_-]next\/?/, async function(req, res, next) {
  const lat = 37.62218579135644;
  const lon = -97.62695789337158;
  const elev = await helpers.getElevation(lat,
      lon,
      process.env.GooglePlacesAPIKey);
  const tz = 'America/Chicago';
  const currentDate = new Date();
  const upcomingSunday = new Date();
  upcomingSunday.setDate(upcomingSunday.getDate()
    + (0 + 7 - upcomingSunday.getDay()) % 7);
  const Friday = moment(upcomingSunday).subtract(2, 'days')
      .format('YYYY-MM-DD');
  const Saturday = moment(upcomingSunday).subtract(1, 'days')
      .format('YYYY-MM-DD');
  const monthF = moment(Friday).month() + 1;
  let open; let close;
  switch (monthF) {
    case 11:
    case 12:
    case 1:
    case 2:
      open = '19:30';
      close = '21:30';
      break;
    case 5:
    case 6:
    case 7:
    case 8:
      open = '21:00';
      close = '23:30';
      break;
    case 3:
    case 4:
    case 9:
    case 10:
      open = '20:30';
      close = '22:30';
      break;
  }
  if (moment(Friday + 'T' + close).isAfter(currentDate)) {
    open = Friday + 'T' + open;
    close = Friday + 'T' + close;
  } else {
    open = Saturday + 'T' + open;
    close = Saturday + 'T' + close;
  }
  const data = {
    lat: lat,
    lon: lon,
    elev: elev,
    tz: tz,
    mag: 6,
    date: open,
    end: close,
  };
  const result = await helpers.pythonCall(data);
  res.json(result);
});

/* weather */
router.get('/weather', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const key = process.env.OpenWeatherMapAPIKey;
  const reply = await helpers.getWeather(lat, lon, key, tz);
  res.json(reply);
});

/* forecast */
router.get('/forecast', async function(req, res, next) {
  const lat = parseFloat(req.query.lat) || 37.62218579135644;
  const lon = parseFloat(req.query.lon) || -97.62695789337158;
  const tz = req.query.tz || 'America/Chicago';
  const key = process.env.OpenWeatherMapAPIKey;
  const reply = await helpers.getForecast(lat, lon, key, tz);
  res.json(reply);
});

module.exports = router;
