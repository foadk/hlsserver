const express = require('express')
var fs = require('fs');
require('dotenv').config({ path: '../hls/.env' })
var jwt = require('jsonwebtoken');
var redis = require("redis"),
    redisClient = redis.createClient();

const app = express()
const port = 3000

app.get('/', (req, res) => res.send('Hello World!'))

const getPlaylist = count => {
    var playlistArray = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        '#EXT-X-MEDIA-SEQUENCE:0',
        '#EXT-X-ALLOW-CACHE:1',
        '#EXT-X-TARGETDURATION:24',
    ]
    for (var i = 1; i <= count; i++) {
        var index = (i - 1) * 4
        for(var j = 1; j <= 4; j++) {
            var chunk = [
                '#EXTINF:6.000000,',
                (index + j) + '.ts'
            ]
            if(1 === (index + j) % 10) chunk.unshift('#EXT-X-DISCONTINUITY')
            playlistArray = playlistArray.concat(chunk)
        }
    }
    const playlist = playlistArray.join('\n');
    return playlist
}

///// Test area

// redisClient.HMSET('key2', {
//     "0123456789": "abcdefghij", // NOTE: key and value will be coerced to strings
//     "some manner of key": "a type of value"
// }, () => {
//     redisClient.HGET('key2', "0123456789", (err, obj) => {
//         console.log(obj)
//         redisClient.hset("key2", "0123456789", "hi", () => {
//             redisClient.HGET('key2', "0123456789", (err, obj) => {
//                 console.log(obj)
//             })
//         })
//     })
// })

// redisClient.hget('key2', '0123456789', (err, val) => {
//     console.log(val)
// })

// console.log(getPlaylist(3))

///// Test area END

app.use('/hls/:token', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    try {
        jwt.verify(req.params.token, process.env.JWT_SECRET)
    } catch (err) {
        res.status(401).end()
    }
    next()
})

// app.get('/hls/:token/playlist', (req, res) => {
//     fs.stat('example_m3u8/playlist.m3u8', function (err, stats) {
//         if (!stats || err) {
//             res.status(404).end()
//         } else {

//             fs.createReadStream('example_m3u8/playlist.m3u8').pipe(res)
//         }
//     })
// })

app.get('/hls/:token/playlist', (req, res) => {
    const jti = jwt.verify(req.params.token, process.env.JWT_SECRET).jti
    const userKey = 'user:' + jti
    var playlist = null
    redisClient.hget(userKey, 'count', (err, val) => {
        if (null === val) {
            redisClient.hset(userKey, 'count', 1)
            playlist = getPlaylist(1)
        } else {
            const newVal = Number(val) + 1
            redisClient.hset(userKey, 'count', newVal)
            playlist = getPlaylist(newVal)
        }
        res.send(playlist)
    })
})

app.get('/hls/:token/:name', (req, res) => {
    const fileNo = req.params.name.split('.')[0]
    const chunkNo = (fileNo % 10 == 0) ? 10 : fileNo % 10
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