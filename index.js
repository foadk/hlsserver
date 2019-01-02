const express = require('express')
var fs = require('fs');

const app = express()
const port = 3000

app.get('/hls/:token/playlist', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    fs.stat('example_m3u8/playlist.m3u8', function (err, stats) {
        if (!stats || err) {
            res.status(404).end()
        }
        else {
            // res.status(200).set('Content-Type', 'application/vnd.apple.mpegurl');
            // fs.createReadStream('example_m3u8/playlist.m3u8').pipe(res)
            fs.createReadStream('example_m3u8/playlist.m3u8').pipe(res)
        }

    })
})

app.get('/hls/:token/:name', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    fs.stat('example_m3u8/' + req.params.name, function (err, stats) {
        if (!stats || err) {
            res.status(404).end()
        }
        else {
            // res.status(200).set('Content-Type', 'application/vnd.apple.mpegurl');
            // fs.createReadStream('example_m3u8/playlist.m3u8').pipe(res)
            fs.createReadStream('example_m3u8/' + req.params.name).pipe(res)
        }

    })
})

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))