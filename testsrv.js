'use strict'

require('dotenv').config()

const Express = require('express')
const App = Express()
const HTTP = require('http')
const BCrypt = require('bcryptjs')

// Router Setup
App.get('/pulse', (req, res) => {
  res.send('NodeJS Performance Optimizations listening on: ' + port)
})

App.get('/stress', async (req, res) => {
  const hash = await BCrypt.hash('this is a long password', 8)
  res.send(hash)
})

// Server Setup
const port = process.env.PORT || 8092
const server = HTTP.createServer(App)

server.listen(port, () => {
  console.log('NodeJS Performance Optimizations listening on: ', port)
})