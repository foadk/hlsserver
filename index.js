const express = require('express')
const fs = require('fs')
require('dotenv').config()
const jwt = require('jsonwebtoken')
const redis = require("redis"),
    redisClient = redis.createClient()

const app = express()
const port = 3000

const NUM_OF_CHUNKS = 10
const CHUNKS_PER_REQ = 4

app.get('/', (req, res) => res.send('Hello World!'))

// Build playlist based on number of request for a user
const getPlaylist = count => {
    var playlistArray = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        '#EXT-X-MEDIA-SEQUENCE:0',
        '#EXT-X-ALLOW-CACHE:1',
        '#EXT-X-TARGETDURATION:24',
    ]
    for (var i = 1; i <= count; i++) {
        var index = (i - 1) * CHUNKS_PER_REQ
        for (var j = 1; j <= CHUNKS_PER_REQ; j++) {
            var chunk = [
                '#EXTINF:6.000000,',
                (index + j) + '.ts'
            ]
            if (1 === (index + j) % NUM_OF_CHUNKS) chunk.unshift('#EXT-X-DISCONTINUITY')
            playlistArray = playlistArray.concat(chunk)
        }
    }
    const playlist = playlistArray.join('\n')
    return playlist
}

// Middleware for CORS and request authorization
app.use('/hls/:token', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    try {
        jwt.verify(req.params.token, process.env.JWT_SECRET)
    } catch (err) {
        res.status(401).end()
    }
    next()
})

// Route for returning  playlist based on number of request for a user
app.get('/hls/:token/playlist', (req, res) => {
    const jti = jwt.verify(req.params.token, process.env.JWT_SECRET).jti
    const userKey = 'user:' + jti
    redisClient.hget(userKey, 'reqCount', (err, val) => {
        const requestCount = (null === val) ? 1 : Number(val) + 1
        redisClient.hset(userKey, 'reqCount', requestCount)
        redisClient.expire(userKey, 60 * 60)
        const playlist = getPlaylist(20)
        res.send(playlist)
    })
})

// Rotue for returning .ts file
app.get('/hls/:token/:name', (req, res) => {
    const fileNo = req.params.name.split('.')[0]
    const chunkNo = (fileNo % NUM_OF_CHUNKS == 0) ? NUM_OF_CHUNKS : fileNo % NUM_OF_CHUNKS
    const fileName = chunkNo + '.ts'
    fs.stat('example_m3u8/' + fileName, function (err, stats) {
        if (!stats || err) {
            res.status(404).end()
        } else {
            fs.createReadStream('example_m3u8/' + fileName).pipe(res)
        }
    })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))