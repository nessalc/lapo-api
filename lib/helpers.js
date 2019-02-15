const fetch = require('node-fetch');
const pMemoize = require('p-memoize');
const moment = require('moment-timezone')
let {
    PythonShell
} = require('python-shell')
var myPythonScriptPath = './lib/whatsup.py';

const fetch_elevation = function (lat, lon, key) {
    let GoogleUrl = 'https://maps.googleapis.com/maps/api/elevation/json?locations=' + lat + ',' + lon + '&key=' + key;
    return fetch(GoogleUrl).then(function (response) {
        return response.json();
    }).then(function (json) {
        let elev = json.results[0].elevation;
        return elev;
    });
}

const weather = function (lat, lon, key,tz) {
    url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=metric&APPID=' + key;
    return fetch(url).then(function (response) {
        return response.json();
    }).then(function(data){
        var temp = data.main.temp;
        var wind_speed=data.wind.speed;
        var feels_like = feels_like_temp(temp,wind_speed,data.main.humidity)
        data.main.temp = {
            celsius: temp,
            fahrenheit: roundOff(CelsiusToFahrenheit(temp),2)
        }
        if (feels_like != temp) {
            data.main.temp.feels_like= {
                celsius: roundOff(feels_like,2),
                fahrenheit: roundOff(CelsiusToFahrenheit(feels_like),2)
            }
        }
        if (data.main.temp_min === data.main.temp_max) { // if these are the same, it's not worth displaying them
            delete data.main.temp_min;
            delete data.main.temp_max;
        } else { //otherwise move them to where it makes more sense
            data.main.temp.min = {
                celsius: data.main.temp_min,
                fahrenheit: roundOff(CelsiusToFahrenheit(data.main.temp_min),2)
            }
            data.main.temp.max = {
                celsius: data.main.temp_max,
                fahrenheit: roundOff(CelsiusToFahrenheit(data.main.temp_max),2)
            }
            delete data.main.temp_min;
            delete data.main.temp_max;
        }
        data.wind.speed = {
            meters_per_second: wind_speed,
            miles_per_hour: roundOff(mpsToMPH(wind_speed),2)
        }
        weathers = data.weather; //yes, apparently there can be more than one "weather"
        weathers.forEach(function(weather){
            iconurl = 'http://openweathermap.org/img/w/' + weather.icon + '.png';
            weather.iconurl = iconurl
        });
        if (data.hasOwnProperty('visibility')) {
            vis = data.visibility;
            data.visibility = {
                km: vis,
                mi: roundOff(kmToMi(vis))
            }
            data.visibility_mi = Math.round((data.visibility / 1609.344) * 100) / 100; // convert visibility to miles
        }
        // reformat date
        try {
            data.dt = moment(data.dt*1000).tz(tz).format();
        } catch (e) {
            console.log(e)
            data.dt = moment(data.dt*1000,tz).format();
        }
        // remove internal parameters
        delete data.sys;
        delete data.cod;
        return data;
    },
    function(err) {
        console.log(err);
        return err;
    });
}

const forecast = function (lat, lon, key, tz) {
    url = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&units=metric&APPID=' + key
    return fetch(url).then(function (response) {
        return response.json();
    }).then(function(data){
        forecasts = data.list;
        forecasts.forEach(function(forecast){
            // The wind chill and heat index formulae (from NOAA/NWS) are based on temperature in degrees Fahrenheit and wind speed in miles per hour.
            var temp = forecast.main.temp
            var wind_speed=forecast.wind.speed;
            var feels_like = feels_like_temp(temp,wind_speed,forecast.main.humidity)
            forecast.main.temp = {
                celsius: temp,
                fahrenheit: roundOff(CelsiusToFahrenheit(temp),2)
            }
            if (feels_like != temp) {
                forecast.main.temp.feels_like= {
                    celsius: roundOff(feels_like,2),
                    fahrenheit: roundOff(CelsiusToFahrenheit(feels_like),2)
                }
            }
            if (forecast.main.temp_min === forecast.main.temp_max) { // if these are the same, it's not worth displaying them
                delete forecast.main.temp_min;
                delete forecast.main.temp_max;
            } else { //otherwise move them to where it makes more sense
                forecast.main.temp.min = {
                    celsius: forecast.main.temp_min,
                    fahrenheit: roundOff(CelsiusToFahrenheit(forecast.main.temp_min),2)
                }
                forecast.main.temp.max = {
                    celsius: forecast.main.temp_max,
                    fahrenheit: roundOff(CelsiusToFahrenheit(forecast.main.temp_max),2)
                }
                delete forecast.main.temp_min;
                delete forecast.main.temp_max;
            }
            forecast.wind.speed = {
                meters_per_second: wind_speed,
                miles_per_hour: roundOff(mpsToMPH(wind_speed),2)
            }
            try {
                data.dt = moment(data.dt*1000).tz(tz).format();
            } catch (e) {
                console.log(e);
                data.dt = moment(data.dt*1000,tz).format();
            }
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
        delete data.cod;
        delete data.message;
        return data;
    });
}

const py_whatsup = function (data) {
    return new Promise(function (resolve, reject) {
        let pyshell = new PythonShell(myPythonScriptPath);
        var result;
        pyshell.send(JSON.stringify(data));
        pyshell.on('message', function (message) {
            result = JSON.parse(message);
            return result;
        });
        pyshell.end(function (err, code, signal) {
            if (err) reject(err);
            resolve(result);
        });
    });
}

const CelsiusToFahrenheit = function (celsius) {
    return celsius * 9 / 5 + 32;
}
const FahrenheitToCelsius = function (fahrenheit) {
    return (fahrenheit - 32) * 5 / 9;
}
const mpsToMPH = function (meters_per_second) {
    return meters_per_second / 0.44704;
}
const feels_like_temp = function (temp_c, wind_mps, relative_humidity) {
    var T = CelsiusToFahrenheit(temp_c) // these calculations are based on a temperature in degrees Fahrenheit
    var W = mpsToMPH(wind_mps) // these calculations are based on a wind speed in miles per hour
    var RH = relative_humidity;
    if (T <= 50 && W >= 3) { // calculate wind chill
        windChill_F = 35.74 + (0.6215 * T) - (35.75 * W ** 0.16) + (0.4275 * T * W ** 0.16);
        return FahrenheitToCelsius(windChill_F);
    } else if (T > 80 && ((245 - (T * 5 / 3)) >= RH)) { // calculate heat index--this one's complicated
        // if relative humidity is more than 245-T*5/3, results of the formula will be absurd, so I don't calculate, but it's best to stay indoors, too!
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
            return FahrenheitToCelsius(HI);
        }
    }
    return FahrenheitToCelsius(T);
}
const roundOff = function (number, digits) {
    return Math.round(number * 10 ** digits) / 10 ** digits;
}
const kmToMi = function(kilometers) {
    return kilometers / 1609.344;
}

const get_elevation = pMemoize(fetch_elevation);
const python_call = pMemoize(py_whatsup, {
    maxAge: 300000
})
const get_weather = pMemoize(weather, {
    maxAge: 60000
});
const get_forecast = pMemoize(forecast, {
    maxAge: 300000
});

module.exports = {
    get_elevation,
    get_weather,
    get_forecast,
    feels_like_temp,
    CelsiusToFahrenheit,
    FahrenheitToCelsius,
    roundOff,
    mpsToMPH,
    kmToMi,
    python_call
}
