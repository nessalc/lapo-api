var express = require('express');
var router = express.Router();

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

module.exports = router;
