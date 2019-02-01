const {fetch} = require('simple-fetch-cache');
const keys = require('../lib/keys');
const pMemoize = require('p-memoize');
let {PythonShell} = require('python-shell')
var myPythonScriptPath = './lib/whatsup.py';

const fetch_elevation = async function(lat,lon) {
    let GoogleUrl = 'https://maps.googleapis.com/maps/api/elevation/json?locations='+lat+','+lon+'&key='+keys.GooglePlacesAPIKey;
    let data = await fetch(GoogleUrl);
    let elev = data.reply.results[0].elevation;
    return elev;
}

const py_whatsup = function(data) {
    return new Promise(function(resolve,reject){
        let pyshell=new PythonShell(myPythonScriptPath);
        var result;
        pyshell.send(JSON.stringify(data));
        pyshell.on('message',function(message){
            result = JSON.parse(message);
            return result;
        });
        pyshell.end(function(err,code,signal){
            if (err) reject(err);
            resolve(result);
        });
    });
}

const get_elevation = pMemoize(fetch_elevation);
const python_call = pMemoize(py_whatsup,{maxAge:30000})

module.exports = {
    get_elevation,
    python_call
}
