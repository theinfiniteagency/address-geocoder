const express = require('express')
const path = require('path')
const app = express()
const multer = require('multer')
const axios = require('axios')
const Papa = require('papaparse')
const stream = require('stream')
const RateLimiter = require('limiter').RateLimiter

let upload = multer()

app.post('/upload', upload.single('locations'), (req, res) => {

  //https://maps.googleapis.com/maps/api/geocode/outputFormat?address=&key=AIzaSyBQAE-6I6Hcv6JsyjVHu6lcI7yK47-FyOw&outputFormat=json
  //let location = results[0].geometry.location

  if(!req.file) return res.status(400).json({ error: 'File required '})
  if(req.file.mimetype != 'text/csv') return res.status(400).json({ error: 'File must be a csv' })

  let output = []
  let failed = []
  let total = 0

  let s = new stream.PassThrough()
  s.end(req.file.buffer)

  let limiter = new RateLimiter(5, 'second')

  Papa.parse(s, {
    step: (row) => {
      total++
      let id = row.data[0][0]
      let title = row.data[0][1]
      let phone_number = row.data[0][2]
      let address = row.data[0][3]
      let city = row.data[0][4]
      let state = row.data[0][5]
      let zip = row.data[0][6]

      let full = `${address} ${city}, ${state} ${zip}`

      let params = {
        params: {
          key: 'AIzaSyBQAE-6I6Hcv6JsyjVHu6lcI7yK47-FyOw',
          address: full
        }
      }

      limiter.removeTokens(1, () => {
        axios.get('https://maps.googleapis.com/maps/api/geocode/json', params).then((results) => {
          if(results.data.results.length == 0) {
            failed.push({
              address,
              city,
              state,
              zip
            })
          } else {
            let location = results.data.results[0].geometry.location
            let data = {
              title,
              phone_number,
              address,
              city,
              state,
              zip,
              latitude: location.lat,
              longitude: location.lng
            }
            output.push(data)
          }
        })
      })

    },
    complete: (results) => {
  		// return res.json(output)
  	}
  })

  let interval = setInterval(() => {
    let completed = output.length + failed.length
    console.log(`Progress: ${completed}/${total}`)
    if(completed == total) {
      console.log('Geocode Complete!')
      clearInterval(interval)
      return res.json({ completed: output, failed })
    }
  }, 1000)

})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/index.html'))
})

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: err
  })
})


module.exports = app;

const port = Number(process.env.PORT || 4040);
app.listen(port, () => {
  console.log('Upload a CSV at http://localhost:' + port)
})
