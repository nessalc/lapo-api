const {
  fetch
} = require('simple-fetch-cache')

const getEvents = async function (calendarId, key, ttl) {
  let now = new Date()
  let thirtyDaysLater = new Date().setDate(now.getDate() + 30)
  // convert dates to ISO strings for Google API
  let timeMin = now.toISOString()
  let timeMax = new Date(thirtyDaysLater).toISOString()
  let orderBy = 'startTime'
  let url = 'https://www.googleapis.com/calendar/v3/calendars/' + calendarId + '/events?key=' + key + '&timeMin=' + timeMin + '&timeMax=' + timeMax + '&singleEvents=true&orderBy=' + orderBy
  let response = await fetch(url, ttl)
  return response.reply
}

module.exports = {
  getEvents
}
