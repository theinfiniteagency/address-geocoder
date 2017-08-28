# Address Geocoder

Accepts a CSV with an address, city, zip and queries coordinates from Google Maps.

## Usage

Add a Google API Key and check column mappings in app.js.

Run the app then visit http://localhost:4040 to upload a CSV.

```
$ node app.js
```

or query for a single address in the command line

```
$ node app.js "2001 Bryan St #3900, Dallas, TX 75201"
```
