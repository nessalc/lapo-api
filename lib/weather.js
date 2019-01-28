const {fetch} = require('simple-fetch-cache');

const weather = async function(lat,lon,key,ttl) {
	url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=metric&APPID=' + key;
    let weather_data = await fetch(url,ttl);
    return weather_data.reply;
}

const forecast = async function(lat,lon,key,ttl) {
    url = 'http://api.openweathermap.org/data/2.5/forecast?lat='+lat+'&lon='+lon+'&units=metric&APPID='+key;
    let forecast_data = await fetch(url, ttl);
    return forecast_data.reply;
}

module.exports = {
    weather,
    forecast
};
