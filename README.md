# Lake Afton API
An endpoint for getting data about Lake Afton Public Observatory
http://api.lakeafton.com

### Contribute

You're gonna need node.js, this was written on v8.11.3

1. Make a fork
2. Clone to your machine
3. CD into the folder
4. run ```npm install```
5. run ```npm start``` or ```nodemon start``` if you have nodemon installed.
6. Write code
7. Upload to your fork
8. Submit a pull request

If you have access to the server you can deploy the code yourself:

1. SSH to the server and log in
2. cd /var/www/lake-afton-api/
3. sudo git pull

The Express server is using PM2 to stay running in the background. Check out the docs for PM2 if you have questions about that.

If you have other any questions, you can reach out at sduncan@lakeafton.com

### Endpoints

* GET `/` -- returns a basic welcome message
* GET `/hours` -- returns current hours of operation
* GET `/planets` -- returns planets that are visible right now
* GET `/planets2` -- returns the following information about all planets:
    * right ascension/declination
    * size (diameter in arcseconds)
    * magnitude
    * earth distance (au, km, mi)
    * sun distance (au, km, mi)
    * phase
    * constellation
    * rise time/rise azimuth
    * transit time/transit altitude
    * set time/set azimuth, 
* GET `/sun` -- returns sunrise, sunset, twilight, and dusk information
* GET `/sun2` -- returns the following information about the sun:
    * right ascension/declination
    * size (diameter in arcseconds)
    * magnitude
    * earth distance (au, km, mi)
    * next solstice
    * next equinox
    * constellation
    * rise time/rise azimuth
    * transit time/transit altitude
    * set time/set azimuth, 
* GET `/moon` -- returns moonrise, moonset, and phase of the moon
* GET `/moon2` -- returns the following information about the moon:
    * right ascension/declination
    * size (diameter in arcseconds)
    * magnitude
    * earth distance (au, km, mi)
    * sun distance (au, km, mi)
    * phase
    * illuminated surface
    * phase name
    * next new moon
    * next first quarter
    * next full moon
    * next last quarter
    * constellation
    * rise time/rise azimuth
    * transit time/transit altitude
    * set time/set azimuth
* GET `/events` -- returns summary, description, start/end time and location of events happening in the next 30 days
* GET `/schedule` -- returns info on the viewing program for the upcoming/current weekend
* GET `/whatsup` -- return names of objects greater than magnitude 6 visible "right now" (see [here](objects.md) for list of objects)
* GET `/whatsup_next` -- returns names of objects greater than magnitude 6 that will be visible the next time LAPO is open.
