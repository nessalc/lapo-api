var express = require('express');
var router = express.Router();
var suncalc = require('suncalc');
var moment = require('moment-timezone')
var viewingSchedule = require('../lib/viewingSchedule')
const {weather,forecast} = require('../lib/weather');
const {get_planet_ephem} = require('../lib/astropical');
const {get_events} = require('../lib/events')
const {get_elevation,python_call} = require('../lib/helpers')
const keys = require('../lib/keys')

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
			response.hours.prettyHours = '7:30pm - 9:30pm';
			response.hours.open = '7:30pm';
			response.hours.close = '9:30pm';
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

//latitude regex
// currently will accept -0; deemed acceptable as parseFloat will turn that into 0.
var latitude_regex = "[\\+\\-]?(?:90|[0-8]\\d|\\d)\\.?\\d*"
//longitude regex
// currently will accept -0; deemed acceptable as parseFloat will turn that into 0.
var longitude_regex = "[\\+\\-]?(?:180|1[0-7]\\d|\\d{1,2})\\.?\\d*"
//tz regex
// should accept any Olson-formatted timezone
var tz_regex = "[\\w\\+\\-]+(?:\\/[\\w\\+\\-]+)*"
//iso8601 regex (timestamp)
//Simplified a *lot*. Accepts several invalid timezone offsets, *requires* four digits for timzeone offset, doesn't prevent invalid month/day combinations, etc.
var timestamp_regex = "\\d{4}-(?:1[012]|0\\d)-(?:3[01]|[012]\\d)T(?:2[0123]|[01]\\d):(?:[012345]\\d)(?::60|:[012345]\\d(?:\\.\\d*)?)(?:Z|[\\+\\-][01]\\d[012345]\\d)"
/*
/planets
/planets/
/planets/lat/lon
/planets/lat/lon/
*/
var planets_regex = new RegExp(`^\\/planets(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex}))?\\/?$`)
router.get(planets_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	const fiveMinutes = 5 * 60 * 60 * 1000;
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
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
/*
/planets2
/planets2/
/planets2/lat/lon
/planets2/lat/lon/
/planets2/lat/lon/tz
/planets2/lat/lon/tz/
/planets2/lat/lon/timestamp
/planets2/lat/lon/timestamp/
/planets2/lat/lon/timestamp/tz
/planets2/lat/lon/timestamp/tz/
*/
var planets2_regex = new RegExp(`^\\/planets2(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex})|\\/(${timestamp_regex})|\\/(${timestamp_regex})\\/(${tz_regex}))?\\/?$`)
router.get(planets2_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = keys.OpenWeatherMapAPIKey
	let elev = await get_elevation(lat, lon);
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let tz = 'America/Chicago';
	let date = moment().format();
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2] || req.params[5]) tz = (req.params[2] || req.params[5]);
	if (req.params[3] || req.params[4]) date = moment((req.params[3] || req.params[4])).format();
	weather_data = await weather(lat, lon, key, fiveMinutes)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
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
		temp: temp,
		date: date
	}
	result = await python_call(data);
	res.json(result);
})
/*
/sun
/sun/
/sun/lat/lon
/sun/lat/lon/
/sun/lat/lon/tz
/sun/lat/lon/tz/
*/
var sun_regex = new RegExp(`^\\/sun(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex}))?\\/?$`)
router.get(sun_regex, function(req, res, next) {
	let currentTime = new Date();
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let tz = 'America/Chicago';
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2]) tz = req.params[2];
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
/*
/sun2
/sun2/
/sun2/lat/lon
/sun2/lat/lon/
/sun2/lat/lon/tz
/sun2/lat/lon/tz/
/sun2/lat/lon/timestamp
/sun2/lat/lon/timestamp/
/sun2/lat/lon/timestamp/tz
/sun2/lat/lon/timestamp/tz/
*/
var sun2_regex = new RegExp(`^\\/sun2(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex})|\\/(${timestamp_regex})|\\/(${timestamp_regex})\\/(${tz_regex}))?\\/?$`)
router.get(sun2_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = keys.OpenWeatherMapAPIKey
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let elev = await get_elevation(lat, lon);
	let tz = 'America/Chicago';
	let date = moment().format();
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2] || req.params[5]) tz = (req.params[2] || req.params[5]);
	if (req.params[3] || req.params[4]) date = moment((req.params[3] || req.params[4])).format();
	let weather_data = await weather(lat, lon, key, fiveMinutes);
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data={
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		body: [
			'sun'
		],
		pressure: pressure,
		temp: temp,
		date: date
	}
	result = await python_call(data);
	res.json(result);
})
/*
/moon
/moon/
/moon/lat/lon
/moon/lat/lon/
/moon/lat/lon/tz
/moon/lat/lon/tz/
*/
var moon_regex = new RegExp(`\\/moon(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex}))?\\/?$`)
router.get(moon_regex, function(req, res, next) {
	let currentTime = new Date()
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let tz = 'America/Chicago';
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2]) tz = req.params[2];
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
/*
/moon2
/moon2/
/moon2/lat/lon
/moon2/lat/lon/
/moon2/lat/lon/tz
/moon2/lat/lon/tz/
/moon2/lat/lon/timestamp
/moon2/lat/lon/timestamp/
/moon2/lat/lon/timestamp/tz
/moon2/lat/lon/timestamp/tz/
*/
var moon2_regex = new RegExp(`\\/moon2(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex})|\\/(${timestamp_regex})|\\/(${timestamp_regex})\\/(${tz_regex}))?\\/?$`)
router.get(moon2_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = keys.OpenWeatherMapAPIKey
	let elev = await get_elevation(lat, lon);
	let tz = 'America/Chicago';
	let date = moment().format();
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2] || req.params[5]) tz = (req.params[2] || req.params[5]);
	if (req.params[3] || req.params[4]) date = moment((req.params[3] || req.params[4])).format();
	const fiveMinutes = 5 * 60 * 60 * 1000;
	weather_data = await weather(lat, lon, key, fiveMinutes)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data = {
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		body: [
			'moon'
		],
		pressure: pressure,
		temp: temp,
		date: date
	}
	result = await python_call(data);
	res.json(result);
})

router.get('/events', async function(req, res, next) {

	let key = keys.GoogleCalendarAPIKey;
	let calendarId = 'lakeafton.com_qojc7kseu2jv9j7jji2gqgqud4@group.calendar.google.com';
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
/*
/whatsup
/whatsup/
/whatsup/lat/lon
/whatsup/lat/lon/
/whatsup/lat/lon/tz
/whatsup/lat/lon/tz/
/whastup/lat/lon/timestamp
/whatsup/lat/lon/timestamp/
/whatsup/lat/lon/timestamp/tz
/whatsup/lat/lon/timestamp/tz/
/whatsup/lat/lon/timestamp/timestamp
/whatsup/lat/lon/timestamp/timestamp/
/whatsup/lat/lon/timestamp/timestamp/tz
/whatsup/lat/lon/timestamp/timestamp/tz/
*/
var whatsup_regex = new RegExp(`\\/whatsup(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex})|\\/(${timestamp_regex})|\\/(${timestamp_regex})\\/(${tz_regex})|\\/(${timestamp_regex})\\/(${timestamp_regex})|\\/(${timestamp_regex})\\/(${timestamp_regex})\\/(${tz_regex}))?\\/?$`)
router.get(whatsup_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = keys.OpenWeatherMapAPIKey;
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let elev = await get_elevation(lat,lon);
	let tz = 'America/Chicago';
	let start = new moment().format();
	let end = start;
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[3] || req.params[4] || req.params[6] || req.params[8]) start = new moment((req.params[3] || req.params[4] || req.params[6] || req.params[8])).format();
	if (req.params[7] || req.params[9]) end = new moment((req.params[7] || req.params[9])).format();
	if (req.params[2] || req.params[5] || req.params[10]) tz = req.params[2] || req.params[5] || req.params[10];
	if ((moment(start) > moment(end)) || 
	   ((req.params[3] || req.params[4] || req.params[6] || req.params[8]) && !(req.params[7] || req.params[9]))) {
		end = start;
	}
	weather_data = await weather(lat, lon, key, fiveMinutes)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data = {
		lat: lat,
		lon: lon,
		elev: elev,
		tz: tz,
		mag: 6,
		pressure: pressure,
		temp: temp,
		date: start,
		end: end
	}
	result = await python_call(data);
	res.json(result);
})
/*
This is specific to LAPO, so no fancy stuff
*/
router.get('/whatsup_next', async function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let elev = await get_elevation(lat,lon);
	let tz = 'America/Chicago';
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2]) tz = req.params[2];
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
		case 3:
		case 4:
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
	result = await python_call(data);
	res.json(result);
})
/*
/weather
/weather/
/weather/lat/lon
/weather/lat/lon/
/weather/lat/lon/tz
/weather/lat/lon/tz/
*/
var weather_regex = new RegExp(`\\/weather(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex}))?\\/?$`)
router.get(weather_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let tz = 'America/Chicago';
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2]) tz = req.params[2];
	let key = keys.OpenWeatherMapAPIKey;
	const fiveMinutes = 5 * 60 * 60 * 1000;
	reply = await weather(lat, lon, key, fiveMinutes);
	weathers = reply.weather; //yes, apparently there can be more than one "weather"
	weathers.forEach(function(weather) {
		iconurl = 'http://openweathermap.org/img/w/' + weather.icon + '.png';
		weather.iconurl = iconurl
	});
	// The wind chill and heat index formulae (from NOAA/NWS) are based on temperature in degrees Fahrenheit and wind speed in miles per hour.
	var T = reply.main.temp * 9 / 5 + 32; // convert temp to Fahrenheit
	var W = reply.wind.speed / 0.44704; // convert wind speed to MPH
	var RH = reply.main.humidity;
	if (T <= 50 && W >=3) { // calculate wind chill
		windChill_F = 35.74 + (0.6215 * T) - (35.75 * W ** 0.16) + (0.4275 * T * W ** 0.16);
		reply.main.windChill = Math.round(((windChill_F - 32) * 5 / 9) * 100) / 100;
		reply.main.windChill_F = Math.round(windChill_F * 100) / 100;
	}
	else if (T > 80) { // calculate heat index--this one's complicated
		var HI = 0.5 * (T + 61 + ((T - 68) * 1.2) + RH * 0.094);
		if ((HI + T) / 2 >= 80) {
			HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
			var ADJ = 0;
			if (RH < 13 && T >= 80 && T <= 112) {
				ADJ = -(((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17));
			} else if (RH > 85 && T >= 80 && T <= 87) {
				ADJ = ((RH - 85) / 10) * ((87 - T) / 5);
			}
			HI = HI + ADJ
			reply.main.heat_index = Math.round(((reply.main.heat_index_F - 32) * 5 / 9) * 100) / 100; // convert to Celsius and round off
			reply.main.heat_index_F = Math.round(HI * 100) / 100; // round off
		}
	}
	reply.main.temp_F = Math.round(T * 100) / 100;
	reply.main.temp_min_F = Math.round((reply.main.temp_min * 9 / 5 + 32) * 100) / 100; // convert min temp to Fahrenheit and round off
	reply.main.temp_max_F = Math.round((reply.main.temp_max * 9 / 5 + 32) * 100) / 100; // convert max temp to Fahrenheit and round off
	reply.wind.speed_mph = Math.round(W * 100) / 100;  // round off wind speed
	if (reply.hasOwnProperty('visibility')) {
		reply.visibility_mi = Math.round((reply.visibility / 1609.344) * 100) / 100; // convert visibility to miles
	}
	// reformat date
	reply.dt = moment.unix(reply.dt).tz(tz).format();
	// remove internal parameters
	delete reply.sys;
	delete reply.cod;
	res.json(reply);
})
/*
/forecast
/forecast/
/forecast/lat/lon
/forecast/lat/lon/
/forecast/lat/lon/tz
/forecast/lat/lon/tz/
*/
var forecast_regex = new RegExp(`\\/forecast(?:\\/(${latitude_regex})\\/(${longitude_regex}))?(?:\\/(${tz_regex}))?\\/?$`)
router.get(forecast_regex, async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = keys.OpenWeatherMapAPIKey;
	let tz = 'America/Chicago';
	if (req.params[0]) lat = parseFloat(req.params[0]);
	if (req.params[1]) lon = parseFloat(req.params[1]);
	if (req.params[2]) tz = req.params[2];
	const fiveMinutes = 5 * 60 * 60 * 1000;
	reply = await forecast(lat, lon, key, fiveMinutes);
	forecasts = reply.list;
	forecasts.forEach(function(forecast){
		// The wind chill and heat index formulae (from NOAA/NWS) are based on temperature in degrees Fahrenheit and wind speed in miles per hour.
		var T = forecast.main.temp * 9 / 5 + 32; // convert temp to Fahrenheit
		var W = forecast.wind.speed / 0.44704; // convert wind speed to MPH
		var RH = forecast.main.humidity;
		if (T <= 50 && W >=3) { // calculate wind chill
			windChill_F = 35.74 + (0.6215 * T) - (35.75 * W ** 0.16) + (0.4275 * T * W ** 0.16);
			forecast.main.windChill = Math.round(((windChill_F - 32) * 5 / 9) * 100) / 100;
			forecast.main.windChill_F = Math.round(windChill_F * 100) / 100;
		}
		else if (T > 80) { // calculate heat index--this one's complicated
			var HI = 0.5 * (T + 61 + ((T - 68) * 1.2) + RH * 0.094);
			if ((HI + T) / 2 >= 80) {
				HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
				var ADJ = 0;
				if (RH < 13 && T >= 80 && T <= 112) {
					ADJ = -(((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17));
				} else if (RH > 85 && T >= 80 && T <= 87) {
					ADJ = ((RH - 85) / 10) * ((87 - T) / 5);
				}
				HI = HI + ADJ
				forecast.main.heat_index = Math.round(((reply.main.heat_index_F - 32) * 5 / 9) * 100) / 100; // convert to Celsius and round off
				forecast.main.heat_index_F = Math.round(HI * 100) / 100; // round off
			}
		}
		forecast.main.temp_F = Math.round(T * 100) / 100;
		if (forecast.temp_min == forecast.temp_max) { // if these are the same, it's not worth displaying them
			delete forecast.temp_min;
			delete forecast.temp_max;
		} else {
			forecast.main.temp_min_F = Math.round((forecast.main.temp_min * 9 / 5 + 32) * 100) / 100; // convert min temp to Fahrenheit and round off
			forecast.main.temp_max_F = Math.round((forecast.main.temp_max * 9 / 5 + 32) * 100) / 100; // convert max temp to Fahrenheit and round off
		}
		forecast.wind.speed_mph = Math.round(W * 100) / 100; // round off wind speed
		forecast.dt=moment.unix(forecast.dt).tz(tz).format();
		weathers = forecast.weather; //yes, apparently there can be more than one "weather"
		weathers.forEach(function(weather){
			iconurl = 'http://openweathermap.org/img/w/' + weather.icon + '.png';
			weather.iconurl = iconurl
		});
		// remove internal parameters
		delete forecast.main.temp_kf;
		delete forecast.sys;
		delete forecast.dt_txt;
	});
	delete reply.cod;
	delete reply.message;
	res.json(reply);
})

module.exports = router;
