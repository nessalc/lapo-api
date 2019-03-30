const fetch = require('node-fetch');

const getEvents = async function(calendarId, key, ttl) {
  const now = new Date();
  const thirtyDaysLater = new Date().setDate(now.getDate() + 30);
  // convert dates to ISO strings for Google API
  const timeMin = now.toISOString();
  const timeMax = new Date(thirtyDaysLater).toISOString();
  const orderBy = 'startTime';
  const url = 'https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events?key=' + key + '&timeMin=' + timeMin + '&timeMax=' + timeMax + '&singleEvents=true&orderBy=' + orderBy;
  fetch(url).then(function(response) {
    return response.json();
  });
};

module.exports = getEvents;
