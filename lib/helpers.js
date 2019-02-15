const fetch = require('node-fetch')
const pMemoize = require('p-memoize')
const moment = require('moment-timezone')
let {
  PythonShell
} = require('python-shell')
var myPythonScriptPath = './lib/whatsup.py'

const fetchElevation = function (lat, lon, key) {
  let GoogleUrl = 'https://maps.googleapis.com/maps/api/elevation/json?locations=' + lat + ',' + lon + '&key=' + key
  return fetch(GoogleUrl).then(function (response) {
    return response.json()
  }).then(function (json) {
    let elev = json.results[0].elevation
    return elev
  })
}

const weather = function (lat, lon, key, tz) {
  let url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=metric&APPID=' + key
  return fetch(url).then(function (response) {
    return response.json()
  }).then(function (data) {
    var temp = data.main.temp
    var windSpeed = data.wind.speed
    var feelsLike = getFeelsLikeTemp(temp, windSpeed, data.main.humidity)
    data.main.temp = {
      celsius: temp,
      fahrenheit: roundOff(CelsiusToFahrenheit(temp), 2)
    }
    if (feelsLike !== temp) {
      data.main.temp.feelsLike = {
        celsius: roundOff(feelsLike, 2),
        fahrenheit: roundOff(CelsiusToFahrenheit(feelsLike), 2)
      }
    }
    if (data.main.temp_min === data.main.temp_max) { // if these are the same, it's not worth displaying them
      delete data.main.temp_min
      delete data.main.temp_max
    } else { // otherwise move them to where it makes more sense
      data.main.temp.min = {
        celsius: data.main.temp_min,
        fahrenheit: roundOff(CelsiusToFahrenheit(data.main.temp_min), 2)
      }
      data.main.temp.max = {
        celsius: data.main.temp_max,
        fahrenheit: roundOff(CelsiusToFahrenheit(data.main.temp_max), 2)
      }
      delete data.main.temp_min
      delete data.main.temp_max
    }
    data.wind.speed = {
      metersPerSecond: windSpeed,
      miles_per_hour: roundOff(mpsToMPH(windSpeed), 2)
    }
    let weathers = data.weather // yes, apparently there can be more than one "weather"
    weathers.forEach(function (weather) {
      let iconurl = 'http://openweathermap.org/img/w/' + weather.icon + '.png'
      weather.iconurl = iconurl
    })
    if (data.hasOwnProperty('visibility')) {
      let vis = data.visibility
      data.visibility = {
        km: vis,
        mi: roundOff(kmToMi(vis))
      }
      data.visibility_mi = Math.round((data.visibility / 1609.344) * 100) / 100 // convert visibility to miles
    }
    // reformat date
    try {
      data.dt = moment(data.dt * 1000, tz).format()
    } catch (e) {
      console.log(e)
    }
    // remove internal parameters
    delete data.sys
    delete data.cod
    return data
  },
  function (err) {
    console.log(err)
    return err
  })
}

const forecast = function (lat, lon, key, tz) {
  let url = 'http://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&units=metric&APPID=' + key
  return fetch(url).then(function (response) {
    return response.json()
  }).then(function (data) {
    if (data.hasOwnProperty('list')) {
      let forecasts = data.list
      forecasts.forEach(function (forecast) {
        // The wind chill and heat index formulae (from NOAA/NWS) are based on temperature in degrees Fahrenheit and wind speed in miles per hour.
        var temp = forecast.main.temp
        var windSpeed = forecast.wind.speed
        var feelsLike = getFeelsLikeTemp(temp, windSpeed, forecast.main.humidity)
        forecast.main.temp = {
          celsius: temp,
          fahrenheit: roundOff(CelsiusToFahrenheit(temp), 2)
        }
        if (feelsLike !== temp) {
          forecast.main.temp.feelsLike = {
            celsius: roundOff(feelsLike, 2),
            fahrenheit: roundOff(CelsiusToFahrenheit(feelsLike), 2)
          }
        }
        if (forecast.main.temp_min === forecast.main.temp_max) { // if these are the same, it's not worth displaying them
          delete forecast.main.temp_min
          delete forecast.main.temp_max
        } else { // otherwise move them to where it makes more sense
          forecast.main.temp.min = {
            celsius: forecast.main.temp_min,
            fahrenheit: roundOff(CelsiusToFahrenheit(forecast.main.temp_min), 2)
          }
          forecast.main.temp.max = {
            celsius: forecast.main.temp_max,
            fahrenheit: roundOff(CelsiusToFahrenheit(forecast.main.temp_max), 2)
          }
          delete forecast.main.temp_min
          delete forecast.main.temp_max
        }
        forecast.wind.speed = {
          metersPerSecond: windSpeed,
          miles_per_hour: roundOff(mpsToMPH(windSpeed), 2)
        }
        try {
          data.dt = moment(data.dt * 1000, tz).format()
        } catch (e) {
          console.log(e)
        }
        let weathers = forecast.weather // yes, apparently there can be more than one "weather"
        weathers.forEach(function (weather) {
          let iconurl = 'http://openweathermap.org/img/w/' + weather.icon + '.png'
          weather.iconurl = iconurl
        })
        // remove internal parameters
        delete forecast.main.temp_kf
        delete forecast.sys
        delete forecast.dt_txt
      })
    }
    delete data.cod
    delete data.message
    return data
  })
}

const whatsup = function (data) {
  return new Promise(function (resolve, reject) {
    let pyshell = new PythonShell(myPythonScriptPath)
    var result
    pyshell.send(JSON.stringify(data))
    pyshell.on('message', function (message) {
      result = JSON.parse(message)
      return result
    })
    pyshell.end(function (err, code, signal) {
      if (err) reject(err)
      resolve(result)
    })
  })
}

const CelsiusToFahrenheit = function (celsius) {
  return celsius * 9 / 5 + 32
}
const FahrenheitToCelsius = function (fahrenheit) {
  return (fahrenheit - 32) * 5 / 9
}
const mpsToMPH = function (metersPerSecond) {
  return metersPerSecond / 0.44704
}
const getFeelsLikeTemp = function (tempCelsius, windMetersPerSecond, relativeHumidity) {
  var T = CelsiusToFahrenheit(tempCelsius) // these calculations are based on a temperature in degrees Fahrenheit
  var W = mpsToMPH(windMetersPerSecond) // these calculations are based on a wind speed in miles per hour
  var RH = relativeHumidity
  if (T <= 50 && W >= 3) { // calculate wind chill
    let windChillF = 35.74 + (0.6215 * T) - (35.75 * W ** 0.16) + (0.4275 * T * W ** 0.16)
    return FahrenheitToCelsius(windChillF)
  } else if (T > 80 && ((245 - (T * 5 / 3)) >= RH)) { // calculate heat index--this one's complicated
    // if relative humidity is more than 245-T*5/3, results of the formula will be absurd, so I don't calculate, but it's best to stay indoors, too!
    var HI = 0.5 * (T + 61 + ((T - 68) * 1.2) + RH * 0.094)
    if ((HI + T) / 2 >= 80) {
      HI = -42.379 + 2.04901523 * T + 10.14333127 * RH - 0.22475541 * T * RH - 0.00683783 * T * T - 0.05481717 * RH * RH + 0.00122874 * T * T * RH + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH
      var ADJ = 0
      if (RH < 13 && T >= 80 && T <= 112) {
        ADJ = -(((13 - RH) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17))
      } else if (RH > 85 && T >= 80 && T <= 87) {
        ADJ = ((RH - 85) / 10) * ((87 - T) / 5)
      }
      HI = HI + ADJ
      return FahrenheitToCelsius(HI)
    }
  }
  return FahrenheitToCelsius(T)
}
const roundOff = function (number, digits) {
  return Math.round(number * 10 ** digits) / 10 ** digits
}
const kmToMi = function (kilometers) {
  return kilometers / 1609.344
}

const getElevation = pMemoize(fetchElevation)
const pythonCall = pMemoize(whatsup, {
  maxAge: 300000
})
const getWeather = pMemoize(weather, {
  maxAge: 60000
})
const getForecast = pMemoize(forecast, {
  maxAge: 300000
})

module.exports = {
  getElevation,
  getWeather,
  getForecast,
  getFeelsLikeTemp,
  CelsiusToFahrenheit,
  FahrenheitToCelsius,
  roundOff,
  mpsToMPH,
  kmToMi,
  pythonCall
}
