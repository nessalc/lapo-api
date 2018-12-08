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
* GET `/sun` -- returns sunrise, sunset, twilight, and dusk information
* GET `/moon` -- returns moonrise, moonset, and phase of the moon
* GET `/events` -- returns summary, description, start/end time and location of events happening in the next 30 days
