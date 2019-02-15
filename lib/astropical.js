const {
  fetch
} = require('simple-fetch-cache')

var BaseUrl = 'http://astropical.space/'

const fetchAndReturn = async function (url, ttl) {
  let response = await fetch(url, ttl)
  if (response.status === 200) {
    return JSON.parse(response.reply)
  } else {
    return JSON.parse('"Error fetching data."')
  }
}

const getPlanetEphem = async function (lat, lon, ttl) {
  let url = BaseUrl + 'api-ephem.php?lat=' + lat + '&lon=' + lon
  return fetchAndReturn(url, ttl)
}

const getEquatorialChart = async function (width, height, ra, dec, fov, ttl) {
  let url = BaseUrl + 'starchart.php?width=' + width + '&height=' + height + '&rc=' + ra + '&dc=' + dec + '&fov=' + fov
  return fetchAndReturn(url, ttl)
}

const getPlanisphere = async function (lat, lon, diameter, ttl, deepsky) {
  let url = BaseUrl + 'starchart.php?planis=1&lat=' + lat + '&lon=' + lon + '&width=' + diameter
  if (deepsky) {
    url = url + 'mes=1&cld=1&ngc=1'
  }
  return fetchAndReturn(url, ttl)
}

const getStarByConstellation = async function (constellation, ttl) {
  let url = BaseUrl + 'api.php?table=stars&which=constellation&limit=' + constellation + '&format=json'
  return fetchAndReturn(url, ttl)
}

const getStarByCommonName = async function (commonName, ttl) {
  let url = BaseUrl + 'api.php?table=stars&which=name' + '&limit=' + commonName + '&format=json'
  return fetchAndReturn(url, ttl)
}

const getStarByCatalog = async function (catalog, number, ttl) {
  let url = BaseUrl + 'api.php?table=stars&which=' + catalog + '&limit=' + number + '&format=json'
  return fetchAndReturn(url, ttl)
}

module.exports = {
  getPlanetEphem,
  getEquatorialChart,
  getPlanisphere,
  getStarByConstellation,
  getStarByCommonName,
  getStarByCatalog
}
