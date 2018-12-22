var express = require('express');
var router = express.Router();
var fetch = require('node-fetch');
var suncalc = require('suncalc');
var moment = require('moment');
var viewingSchedule = require('../lib/viewingSchedule')

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
			prettyHours:'',
			open:'',
			close:''
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

router.get('/planets', async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let url = 'http://www.astropical.space/astrodb/api-ephem.php?lat='+lat+'&lon='+lon;

	let response = await fetch(url);
	let data = await response.json();

	// now we have the data
	let planets = data.response

	let visiblePlanets = []

	planets.forEach(function(planet) {
		if (planet.alt > 0) {

			let brightness = ''

			if (planet.mag < -3) {
				brightness = 'extremely bright'
			} else if (planet.mag >= -3 && planet.mag < 0) {
				brightness = 'very bright'
			} else if (planet.mag >= 0 && planet.mag < 1) {
				brightness = 'bright'
			} else if (planet.mag >= 1 && planet.mag < 2) {
				brightness = 'average'
			} else if (planet.mag >= 2 && planet.mag < 6.5) {
				brightness = 'dim'
			} else {
				brightness = 'not visible to naked eye'
			}

			let prettyPlanetStruct = {
				name:planet.name,
				altitudeDegrees:planet.alt,
				distanceFromEarthAU:planet.au_earth,
				magnitude:planet.mag,
				brightness:brightness,
				constellation:planet.const
			}

			visiblePlanets.push(prettyPlanetStruct)
		}
	})

	res.json(visiblePlanets)

})

router.get('/sun', function(req, res, next) {
	let currentTime = new Date()
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let response = {
		times:{
			nadir:'',
			night_end:'',
			astro_twilight_end:'',
			sunrise:'',
			solar_noon:'',
			sunset:'',
			astro_twilight_start:'',
			night_start:'',
		}
	};
	let times = suncalc.getTimes(currentTime, lat, lon);
	function formatTime(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours %= 12;
		hours = hours ? hours : 12;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}
	/* Populate JSON construct */
	/* Future: check if current time is later than displayed time; update
	   to next day's time if this is the case */
	response.times.nadir = formatTime(times.nadir);
	response.times.night_end = formatTime(times.nightEnd);
	response.times.astro_twilight_end = formatTime(times.nauticalDawn);
	response.times.sunrise = formatTime(times.sunrise);
	response.times.solar_noon = formatTime(times.solarNoon);
	response.times.sunset = formatTime(times.sunset);
	response.times.astro_twilight_start = formatTime(times.nauticalDusk);
	response.times.night_start = formatTime(times.night);
	res.json(response);
})

router.get('/moon', function(req, res, next) {
	let currentTime = new Date()
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let lazy = 0.03;
	let response = {
		moonrise:'',
		phase:'',
		moonset:'',
		illumination:0
	};
	let times = suncalc.getMoonTimes(currentTime,lat,lon);
	let illum = suncalc.getMoonIllumination(currentTime);
	function formatTime(date) {
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var ampm = hours >= 12 ? 'pm' : 'am';
		hours %= 12;
		hours = hours ? hours : 12;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		var strTime = hours + ':' + minutes + ' ' + ampm;
		return strTime;
	}
	/* Populate JSON construct */
	/* Future: check if current time is later than displayed time; update
	   to next day's time if this is the case */
	response.moonrise = formatTime(times.rise);
	response.moonset = formatTime(times.set);
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

router.get('/events', async function(req, res, next) {

	let key = 'AIzaSyDeefIJYspYQXSULfbivbzD26XCiOfIlYc';
	let calenderId = 'lakeafton.com_qojc7kseu2jv9j7jji2gqgqud4@group.calendar.google.com';
	let now = new Date();
	let thirty_days_later = new Date().setDate(now.getDate()+30);
	// convert dates to ISO strings for Google API
	let timeMin = now.toISOString();
	let timeMax = new Date(thirty_days_later).toISOString();
	let orderBy = 'startTime';

	let url = 'https://www.googleapis.com/calendar/v3/calendars/'+calenderId+'/events?key='+key+'&timeMin='+timeMin+'&timeMax='+timeMax+'&singleEvents=true&orderBy='+orderBy;
	let response = await fetch(url);
	let data = await response.json();

	let events = data.items
	let events_for_display = []

	events.forEach(function(event) {
		let startDate = new Date(event.start.dateTime).toString();
		let endDate = new Date(event.end.dateTime).toString();
		let eventStruct = {
			summary:event.summary,
			description:event.description,
			startTime:startDate,
			endTime:endDate,
			location:event.location
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
	let upcomingSundayFormatted = moment(upcomingSunday).format('MM-DD-YYYY');
	let relevantFriday = moment(upcomingSunday).subtract(2,'days');
	let relevantFridayFormatted = moment(relevantFriday).format('MM-DD-YYYY');

	let response = {
		schedule:viewingSchedule[relevantFridayFormatted]
	};

	res.json(response);

})

module.exports = router;
