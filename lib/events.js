const {fetch} = require('simple-fetch-cache');

const get_events = async function(calendarId,key,ttl) {
    let now = new Date();
    let thirty_days_later = new Date().setDate(now.getDate()+30);
    // convert dates to ISO strings for Google API
    let timeMin = now.toISOString();
    let timeMax = new Date(thirty_days_later).toISOString();
    let orderBy = 'startTime';
    let url = 'https://www.googleapis.com/calendar/v3/calendars/'+calendarId+'/events?key='+key+'&timeMin='+timeMin+'&timeMax='+timeMax+'&singleEvents=true&orderBy='+orderBy;
    let response = await fetch(url,ttl);
    return response.reply;
}

module.exports = {
    get_events
}
