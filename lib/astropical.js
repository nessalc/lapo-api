const {fetch} = require('simple-fetch-cache');

var base_url = 'http://astropical.space/'

const fetch_and_return = async function(url, ttl) {
    response=await fetch(url, ttl);
    if (response.status === 200) {
        return JSON.parse(response.reply);
    } else {
        return JSON.parse('"Error fetching data."')
    }
}

const get_planet_ephem = async function(lat, lon, ttl) {
    url = base_url + 'api-ephem.php?lat=' + lat + '&lon=' + lon;
    return await fetch_and_return(url, ttl);
}

const get_equatorial_chart = async function(width, height, ra, dec, fov, ttl) {
    url = base_url + 'starchart.php?width=' + width + '&height=' + height + '&rc=' + ra + '&dc=' + dec + '&fov=' + fov;
    return await fetch_and_return(url, ttl);
}

const get_planisphere = async function(lat, lon, diameter, ttl, deepsky) {
    url = base_url + 'starchart.php?planis=1&lat=' + lat + '&lon=' + lon + '&width=' + diameter;
    if (deepsky) {
        url = url + 'mes=1&cld=1&ngc=1';
    }
    return await fetch_and_return(url, ttl);
}

const get_star_by_constellation = async function(constellation, ttl) {
    url = base_url + 'api.php?table=stars&which=constellation&limit=' + constellation + '&format=json';
    return await fetch_and_return(url, ttl);
}

const get_star_by_common_name = async function(common_name, ttl) {
    url = base_url + 'api.php?table=stars&which=' + name + '&limit=' + common_name + '&format=json';
    return await fetch_and_return(url, ttl);
}

const get_star_by_catalog = async function(catalog, number, ttl) {
    url = base_url + 'api.php?table=stars&which=' + catalog + '&limit=' + number + '&format=json';
    return await fetch_and_return(url, ttl);
}

module.exports = {
    get_planet_ephem,
    get_equatorial_chart,
    get_planisphere,
    get_star_by_constellation,
    get_star_by_common_name,
    get_star_by_catalog
}
