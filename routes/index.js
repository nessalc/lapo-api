var express = require('express');
var router = express.Router();
var suncalc = require('suncalc');
var moment = require('moment-timezone')
var viewingSchedule = require('../lib/viewingSchedule')
const {weather,forecast} = require('../lib/weather');
let {PythonShell} = require('python-shell')
var myPythonScriptPath = './lib/whatsup.py';
const {get_planet_ephem} = require('../lib/astropical');
const {get_events} = require('../lib/events')

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
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let data = await get_planet_ephem(lat,lon,fiveMinutes);
	// now we have the data
	let planets = data.response;
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

router.get('/planets2', async function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = '0dff06f7549362ac6159aa07ae40f5fa'
	let elev=421;
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let tz = 'America/Chicago';
	weather_data = await weather(lat,lon,key,fiveMinutes)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data={
		lat:lat,
		lon:lon,
		elev:elev,
		tz:tz,
		body:[
			'mercury',
			'venus',
			'mars',
			'jupiter',
			'saturn',
			'uranus',
			'neptune',
			'pluto'
		],
		pressure:pressure,
		temp:temp
	}
	let pyshell=new PythonShell(myPythonScriptPath);
	pyshell.send(JSON.stringify(data));
	pyshell.on('message',function(message){
		res.json(JSON.parse(message));
	});
	pyshell.end(function(err,code,signal){
		if (err) throw err;
		console.log('finished');
	});
})

router.get('/sun', function(req, res, next) {
	let currentTime = new Date();
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

router.get('/sun2', async function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = '0dff06f7549362ac6159aa07ae40f5fa'
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let elev=421;
	let tz = 'America/Chicago';
	let weather_data = await weather(lat,lon,key,fiveMinutes);
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data={
		lat:lat,
		lon:lon,
		elev:elev,
		tz:tz,
		body:[
			'sun'
		],
		pressure:pressure,
		temp:temp
	}
	let pyshell=new PythonShell(myPythonScriptPath);
	pyshell.send(JSON.stringify(data));
	pyshell.on('message',function(message){
		res.json(JSON.parse(message));
	});
	pyshell.end(function(err,code,signal){
		if (err) throw err;
		console.log('finished');
	});
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

router.get('/moon2', async function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = '0dff06f7549362ac6159aa07ae40f5fa'
	let elev=421;
	let tz = 'America/Chicago';
	const fiveMinutes = 5 * 60 * 60 * 1000;
	weather_data = await weather(lat,lon,key,fiveMinutes)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data={
		lat:lat,
		lon:lon,
		elev:elev,
		tz:tz,
		body:[
			'moon'
		],
		pressure:pressure,
		temp:temp
	}
	let pyshell=new PythonShell(myPythonScriptPath);
	pyshell.send(JSON.stringify(data));
	pyshell.on('message',function(message){
		res.json(JSON.parse(message));
	});
	pyshell.end(function(err,code,signal){
		if (err) throw err;
		console.log('finished');
	});
})

router.get('/events', async function(req, res, next) {

	let key = 'AIzaSyDeefIJYspYQXSULfbivbzD26XCiOfIlYc';
	let calendarId = 'lakeafton.com_qojc7kseu2jv9j7jji2gqgqud4@group.calendar.google.com';
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let data = await get_events(calendarId,key,fiveMinutes);
	
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

router.get('/whatsup', async function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = '0dff06f7549362ac6159aa07ae40f5fa'
	const fiveMinutes = 5 * 60 * 60 * 1000;
	let elev=421;
	let tz = 'America/Chicago';
	weather_data = await weather(lat,lon,key,fiveMinutes)
	pressure = weather_data.main.pressure;
	temp = weather_data.main.temp;
	data={
		lat:lat,
		lon:lon,
		elev:elev,
		tz:tz,
		mag:6,
		pressure:pressure,
		temp:temp
	}
	let pyshell=new PythonShell(myPythonScriptPath);
	pyshell.send(JSON.stringify(data));
	pyshell.on('message',function(message){
		res.json(JSON.parse(message));
	});
	pyshell.end(function(err,code,signal){
		if (err) throw err;
		console.log('finished');
	});
})

router.get('/whatsup_next', function(req,res,next){
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let elev=421;
	let currentDate = new Date();
	let upcomingSunday=new Date();
	upcomingSunday.setDate(upcomingSunday.getDate() + (0 + 7 - upcomingSunday.getDay()) % 7);
	let Friday = moment(upcomingSunday).subtract(2,'days').format('YYYY-MM-DD');
	let Saturday = moment(upcomingSunday).subtract(1,'days').format('YYYY-MM-DD');
	let monthF=moment(Friday).month()+1;
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
	if (moment(Friday+'T'+close).isAfter(currentDate)){
		open=Friday+'T'+open
		close=Friday+'T'+close
	} else {
		open=Saturday+'T'+open
		close=Saturday+'T'+close
	}
	data={
		lat:lat,
		lon:lon,
		elev:elev,
		tz:'America/Chicago',
		mag:6,
		date:open,
		end:close
	}
	let pyshell=new PythonShell(myPythonScriptPath);
	pyshell.send(JSON.stringify(data));
	pyshell.on('message',function(message){
		res.json(JSON.parse(message));
	});
	pyshell.end(function(err,code,signal){
		if (err) throw err;
		console.log('finished');
	});
})

router.get('/weather', async function(req,res,next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = '0dff06f7549362ac6159aa07ae40f5fa'
	const fiveMinutes = 5 * 60 * 60 * 1000;
	reply = await weather(lat,lon,key,fiveMinutes);
	weathers = reply.weather; //yes, apparently there can be more than one "weather"
	weathers.forEach(function(weather) {
		iconurl = 'http://openweathermap.org/img/w/' + weather.icon + '.png';
		weather.iconurl = iconurl
	});
	var T = reply.main.temp * 9 / 5 + 32;
	var W = reply.wind.speed / 0.44704;
	var RH = reply.main.humidity;
	if (T <= 50 && W >=3) {
		windChill_F = 35.74 + (0.6215 * T) - (35.75 * W ** 0.16) + (0.4275 * T * W ** 0.16);
		reply.main.windChill = Math.round(((windChill_F - 32) * 5 / 9) * 100) / 100;
		reply.main.windChill_F = Math.round(windChill_F * 100) / 100;
	}
	else if (T > 80) {
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
			reply.main.heat_index = Math.round(((reply.main.heat_index_F - 32) * 5 / 9) * 100) / 100;
			reply.main.heat_index_F = Math.round(HI * 100) / 100;
		}
	}
	reply.main.temp_F = Math.round(T * 100) / 100;
	reply.main.temp_min_F = Math.round((reply.main.temp_min * 9 / 5 + 32) * 100) / 100;
	reply.main.temp_max_F = Math.round((reply.main.temp_max * 9 / 5 + 32) * 100) / 100;
	reply.wind.speed_mph = Math.round(W * 100) / 100;
	if (reply.hasOwnProperty('visibility')) {
		reply.visibility_mi = Math.round((reply.visibility / 1609.344) * 100) / 100;
	}
	// reformat date
	reply.dt = moment.unix(reply.dt).tz('America/Chicago').format();
	// remove internal parameters
	delete reply.sys;
	delete reply.cod;
	res.json(reply);
})

router.get('/forecast', async function(req, res, next) {
	let lat = 37.62218579135644;
	let lon = -97.62695789337158;
	let key = '0dff06f7549362ac6159aa07ae40f5fa';
	let tz = 'America/Chicago';
	const fiveMinutes = 5 * 60 * 60 * 1000;
	url = 'http://api.openweathermap.org/data/2.5/forecast?lat='+lat+'&lon='+lon+'&units=metric&APPID='+key
	reply = await forecast(lat,lon,key,fiveMinutes);
	forecasts = reply.list;
	forecasts.forEach(function(forecast){
		var T = forecast.main.temp * 9 / 5 + 32;
		var W = forecast.wind.speed / 0.44704;
		forecast.main.temp_F = Math.round(T * 100) / 100;
		if (forecast.temp_min == forecast.temp_max) {
			delete forecast.temp_min;
			delete forecast.temp_max;
		} else {
			forecast.main.temp_min_F = Math.round((forecast.main.temp_min * 9 / 5 + 32) * 100) / 100;
			forecast.main.temp_max_F = Math.round((forecast.main.temp_max * 9 / 5 + 32) * 100) / 100;
		}
		forecast.wind.speed_mph = Math.round(W * 100) / 100;
		forecast.dt=moment.unix(forecast.dt).tz(tz).format();
		weathers = forecast.weather; //yes, apparently there can be more than one "weather"
		weathers.forEach(function(weather){
			iconurl='http://openweathermap.org/img/w/'+weather.icon+'.png';
			weather.iconurl=iconurl
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
