require('dotenv').config()
var express = require('express');
var router = express.Router();
var suncalc = require('suncalc');
var moment = require('moment-timezone')
var viewingSchedule = require('../lib/viewingSchedule')
const {get_planet_ephem} = require('../lib/astropical');
const {get_events} = require('../lib/events')
const helpers = require('../lib/helpers')

/* GET home page. */
router.get('/', function(req, res, next) {
	let response = {
		message:'Welcome to the Lake Afton Public Observatory API! To contribute, visit https://github.com/openwichita/lake-afton-api'
	};
	res.json(response);
});

router.get('/hours', function(req, res, next) {
	let currentTime = new Date()
	let month = currentTime.getMonth() + 1
	let day = currentTime.getDate()
	let year = currentTime.getFullYear()
	let response = {
		hours:{
			prettyHours: '',
			open: '',
			close: ''
		}
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
})

router.get('/planets', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let data = await get_planet_ephem(lat, lon, fiveMinutes);
	// now we have the data
	let planets = data.response;
	if (planets !== undefined) {
		let visiblePlanets = []

		planets.forEach(function(planet) {
			if (planet.alt > 0) {

				let brightness = ''
				if (planet.mag > 6.5) {
					brightness = 'not visible to naked eye'
				} else if (planet.mag >= 2) {
					brightness = 'dim'
				} else if (planet.mag >= 1) {
					brightness = 'average'
				} else if (planet.mag >= 0) {
					brightness = 'bright'
				} else if (planet.mag >= -3) {
					brightness = 'very bright'
				} else {
					brightness = 'extremely bright'
				}

				let prettyPlanetStruct = {
					name: planet.name,
					altitudeDegrees: planet.alt,
					distanceFromEarthAU: planet.au_earth,
					distanceFromEarthMiles: planet.au_earth * 149597870700 / 1609.344,
					magnitude: planet.mag,
					brightness: brightness,
					constellation: planet.const
				}

				visiblePlanets.push(prettyPlanetStruct)
			}
		});
		res.json(visiblePlanets)
	} else {
		res.json(data)
	}

})
router.get('/planets2', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let date = moment(req.query.dt).format();
	let key = process.env.OpenWeatherMapAPIKey
	let elev = await helpers.get_elevation(lat, lon, process.env.GooglePlacesAPIKey);
	weather_data = await helpers.get_weather(lat, lon, key)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp.celsius;
	data = {
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
			'pluto'
		],
		pressure: pressure,
		temp: temp
	}
	if (req.query.dt) {
		data.date = date;
	}
	result = await helpers.python_call(data);
	res.json(result);
})
router.get('/sun', function(req, res, next) {
	let currentTime = new Date();
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let response = {
		times:{
			nadir: '',
			night_end: '',
			astro_twilight_end: '',
			sunrise: '',
			solar_noon: '',
			sunset: '',
			astro_twilight_start: '',
			night_start: '',
		}
	};
	let times = suncalc.getTimes(currentTime, lat, lon);
	/* Populate JSON construct */
	/* Future: check if current time is later than displayed time; update
	   to next day's time if this is the case */
	response.times.nadir = moment(times.nadir).tz(tz).format('h:mma z');
	response.times.night_end = moment(times.nightEnd).tz(tz).format('h:mma z');
	response.times.astro_twilight_end = moment(times.nauticalDawn).tz(tz).format('h:mma z');
	response.times.sunrise = moment(times.sunrise).tz(tz).format('h:mma z');
	response.times.solar_noon = moment(times.solarNoon).tz(tz).format('h:mma z');
	response.times.sunset = moment(times.sunset).tz(tz).format('h:mma z');
	response.times.astro_twilight_start = moment(times.nauticalDusk).tz(tz).format('h:mma z');
	response.times.night_start = moment(times.night).tz(tz).format('h:mma z');
	res.json(response);
})
router.get('/sun2', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let date = moment(req.query.dt).format();
	let key = process.env.OpenWeatherMapAPIKey
	let elev = await helpers.get_elevation(lat, lon, process.env.GooglePlacesAPIKey);
	let weather_data = await helpers.get_weather(lat, lon, key);
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp.celsius;
	data={
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		body: [
			'sun'
		],
		pressure: pressure,
		temp: temp
	}
	if (req.query.dt) {
		data.date = date;
	}
	result = await helpers.python_call(data);
	res.json(result);
})
router.get('/moon', function(req, res, next) {
	let currentTime = new Date()
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let lazy = 0.03;
	let response = {
		moonrise: '',
		phase: '',
		moonset: '',
		illumination: 0
	};
	let times = suncalc.getMoonTimes(currentTime, lat, lon);
	let illum = suncalc.getMoonIllumination(currentTime);
	/* Populate JSON construct */
	/* Future: check if current time is later than displayed time; update
	   to next day's time if this is the case */
	response.moonrise = moment(times.rise).tz(tz).format('h:mma z');
	response.moonset = moment(times.set).tz(tz).format('h:mma z');
	response.illumination = (illum.fraction * 100).toPrecision(4) + ' %'; //percent illumnation
	//get phase in common terms
	if ((illum.phase >= (1 - lazy)) || (illum.phase <= (0 + lazy))) {
		response.phase = "New Moon";
	} else if (illum.phase < (0.25 - lazy)) {
		response.phase = "Waxing Crescent";
	} else if ((illum.phase >= (0.25 - lazy)) && (illum.phase <= (0.25 + lazy))) {
		response.phase = "First Quarter";
	} else if (illum.phase < (0.5 - lazy)) {
		response.phase = "Waxing Gibbous";
	} else if ((illum.phase >= (0.5 - lazy)) && (illum.phase <= (0.5 + lazy))) {
		response.phase = "Full Moon";
	} else if (illum.phase < (0.75 - lazy)) {
		response.phase = "Waning Gibbous";
	} else if ((illum.phase >= (0.75 - lazy)) && (illum.phase <= (0.75 + lazy))) {
		response.phase = "Last Quarter";
	} else if (illum.phase < (1 - lazy)) {
		response.phase = "Waning Crescent";
	} else {
		response.phase = "Green Cheese?";
	}
	res.json(response);
})
router.get('/moon2', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let date = moment(req.query.dt).format();
	let key = process.env.OpenWeatherMapAPIKey
	let elev = await helpers.get_elevation(lat, lon, process.env.GooglePlacesAPIKey);
	weather_data = await helpers.get_weather(lat, lon, key)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp.celsius;
	data = {
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		body: [
			'moon'
		],
		pressure: pressure,
		temp: temp
	}
	if (req.query.dt) {
		data.date = date;
	}
	result = await helpers.python_call(data);
	res.json(result);
})
router.get('/events', async function(req, res, next) {

	let key = process.env.GoogleCalendarAPIKey;
	let calendarId = process.env.GoogleCalendarId
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let data = await get_events(calendarId, key, fiveMinutes);
	
	let events = data.items
	let events_for_display = []

	events.forEach(function(event) {
		let startDate = new Date(event.start.dateTime).toString();
		let endDate = new Date(event.end.dateTime).toString();
		let eventStruct = {
			summary: event.summary,
			description: event.description,
			startTime: startDate,
			endTime: endDate,
			location: event.location
		}
		events_for_display.push(eventStruct)
	})

	res.json(events_for_display);
})
router.get('/schedule', function(req, res, next) {

	// get the date of the upcoming Sunday, then subtract two days to get the relevant Friday
	// the schedules are made for "fridays" but they apply for both Friday and Saturday, so
	// if someone requests the schedule on Saturday, we need to get the schedule that's made for "yesterday"
	// but if they request on a Thursday, we need to get it for "tomorrow" -- so we use the next Sunday, minus two
	// days to get that. Math'd.

	// the schedule lives in /lib/viewingSchedule and is manually generated with by minions

	let upcomingSunday = new Date();
	upcomingSunday.setDate(upcomingSunday.getDate() + (0 + 7 - upcomingSunday.getDay()) % 7);
	//let upcomingSundayFormatted = moment(upcomingSunday).format('MM-DD-YYYY');
	let relevantFriday = moment(upcomingSunday).subtract(2,'days');
	let relevantFridayFormatted = moment(relevantFriday).format('MM-DD-YYYY');

	let response = {
		schedule: viewingSchedule[relevantFridayFormatted]
	};

	res.json(response);

})
router.get('/whatsup', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let start = moment(req.query.start).format();
	let end = moment(req.query.end).format();
	let key = process.env.OpenWeatherMapAPIKey;
	let elev = await helpers.get_elevation(lat, lon, process.env.GooglePlacesAPIKey);
	if (moment(start) > moment(end)) {
		end = start;
	}
	weather_data = await helpers.get_weather(lat, lon, key)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp.celsius;
	data = {
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		mag: 6,
		pressure: pressure,
		temp: temp
	}
	if (req.query.start) {
		data.date = start;
	}
	if (req.query.end) {
		data.end = end;
	}
	result = await helpers.python_call(data);
	res.json(result);
})
/*
This is specific to LAPO, so no fancy stuff
*/
router.get(/whatsup[_\-]next\/?/, async function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let elev = await helpers.get_elevation(lat,lon,process.env.GooglePlacesAPIKey);
	let tz = 'America/Chicago';
	let currentDate = new Date();
	let upcomingSunday = new Date();
	upcomingSunday.setDate(upcomingSunday.getDate() + (0 + 7 - upcomingSunday.getDay()) % 7);
	let Friday = moment(upcomingSunday).subtract(2,'days').format('YYYY-MM-DD');
	let Saturday = moment(upcomingSunday).subtract(1,'days').format('YYYY-MM-DD');
	let monthF = moment(Friday).month()+1;
	var open,close;
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
	if (moment(Friday + 'T' + close).isAfter(currentDate)){
		open=Friday + 'T' + open
		close=Friday + 'T' + close
	} else {
		open=Saturday + 'T' + open
		close=Saturday + 'T' + close
	}
	data={
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		mag: 6,
		date: open,
		end: close
	}
	result = await helpers.python_call(data);
	res.json(result);
})
router.get('/weather', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let key = process.env.OpenWeatherMapAPIKey;
	reply = await helpers.get_weather(lat, lon, key,tz);
	res.json(reply);
})
router.get('/forecast', async function(req, res, next) {
	let lat = parseFloat(req.query.lat) || 37.62218579135644;
	let lon = parseFloat(req.query.lon) || -97.62695789337158;
	let tz = req.query.tz || 'America/Chicago';
	let key = process.env.OpenWeatherMapAPIKey;
	reply = await helpers.get_forecast(lat, lon, key, tz);
	res.json(reply);
})

module.exports = router;
