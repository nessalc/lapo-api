const {fetch} = require('simple-fetch-cache');

const get_planet_ephem = async function(lat,lon,ttl) {
    url = 'http://astropical.space/astrodb/api-ephem.php?lat='+lat+'&lon='+lon;
    response=await fetch(url,ttl);
    return JSON.parse(response.reply);
}

const get_equatorial_chart = async function(width,height,ra,dec,fov,ttl) {
    url = 'http://astropical.space/astrodb/starchart.php?width='+width+'&height='+height+'&rc='+ra+'&dc='+dec+'&fov='+fov;
    response=await fetch(url,ttl);
    return JSON.parse(response.reply);
}

const get_planisphere = async function(lat,lon,diameter,ttl,deepsky) {
    url = 'http://astropical.space/astrodb/starchart.php?planis=1&lat='+lat+'&lon='+lon+'&width='+diameter;
    if (deepsky) {
        url = url + 'mes=1&cld=1&ngc=1';
    }
    response=await fetch(url,ttl);
    return JSON.parse(response.reply);
}

const get_star_by_constellation = async function(constellation,ttl) {
    url = 'http://astropical.space/astrodb/api.php?table=stars&which=constellation&limit='+constellation+'&format=json';
    response=await fetch(url,ttl);
    return JSON.parse(response.reply);
}

const get_star_by_common_name = async function(common_name,ttl) {
    url = 'http://astropical.space/astrodb/api.php?table=stars&which='+name+'&limit='+common_name+'&format=json';
    response=await fetch(url,ttl);
    return JSON.parse(response.reply);
}

const get_star_by_catalog = async function(catalog,number,ttl) {
    url = 'http://astropical.space/astrodb/api.php?table=stars&which='+catalog+'&limit='+number+'&format=json';
    response=await fetch(url,ttl);
    return JSON.parse(response.reply);
}

module.exports = {
    get_planet_ephem,
    get_equatorial_chart,
    get_planisphere,
    get_star_by_constellation,
    get_star_by_common_name,
    get_star_by_catalog
}
