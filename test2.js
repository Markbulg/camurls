const app = require('express')()

const getDurationInMilliseconds  = (start) => {
    const NS_PER_SEC = 1e9
    const NS_TO_MS = 1e6
    const diff = process.hrtime(start)

    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
}

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} [STARTED]`)
    const start = process.hrtime()

    res.on('finish', () => {            
        const durationInMilliseconds = getDurationInMilliseconds (start)
        console.log(`${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`)
    })

    res.on('close', () => {
        const durationInMilliseconds = getDurationInMilliseconds (start)
        console.log(`${req.method} ${req.originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms`)
    })

    next()
})

// send response immediately
app.get('/fast/', (req, res) => {
    //res.sendStatus(200)
	res.send('Ok')
})

// mock heavy load, send response after 10 seconds
app.get('/slow/', (req, res) => {
    setTimeout(() => res.sendStatus(200), 10 * 1000)
})

app.listen(3000, () => {
    console.log('Server started')
})
