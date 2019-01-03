const express = require('express')
var fs = require('fs');
require('dotenv').config({ path: '../hls/.env' })
var jwt = require('jsonwebtoken');

const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

app.use('/hls/:token', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    try {
        jwt.verify(req.params.token, process.env.JWT_SECRET)
    } catch(err) {
        res.status(401).end()
    }
    next()
})

app.get('/hls/:token/playlist', (req, res) => {
    fs.stat('example_m3u8/playlist.m3u8', function (err, stats) {
        if (!stats || err) {
            res.status(404).end()
        } else {
            fs.createReadStream('example_m3u8/playlist.m3u8').pipe(res)
        }
    })
})

app.get('/hls/:token/:name', (req, res) => {
    fs.stat('example_m3u8/' + req.params.name, function (err, stats) {
        if (!stats || err) {
            res.status(404).end()
        } else {
            fs.createReadStream('example_m3u8/' + req.params.name).pipe(res)
        }
    })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))