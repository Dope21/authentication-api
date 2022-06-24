var express = require('express')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const bycrypt = require('bcrypt')
const saltRound = 10
const jwt = require('jsonwebtoken')
const secret = 'I dont understand shit'

app.use(cors())

const mysql = require('mysql2')
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'my_db'
})

app.post('/register', jsonParser, function (req, res, next) {

  connection.execute(
    
    `SELECT * FROM users WHERE username = ?`,
    [req.body.username],
    function(err, users, fields) {

      if(users.length !== 0) return res.json({status: false, message: 'this usersname already in use'})

      bycrypt.hash(req.body.password, saltRound, (err, hash) => {
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        [req.body.username, hash],
        function(err, results, fields) {
          if (err) {
            res.json({status: false, message: err})
            return
          }
          res.json({status: results})
        } 
      })
    }
  )


})

app.post('/login', jsonParser, function (req, res, next) {

  connection.execute(

    `SELECT * FROM users WHERE username = ?`,
    [req.body.username],
    function(err, users, fields) {

      if (err) return res.json({status: false, message: err})
      if (users.length == 0) return res.json({status: false, message: 'no user fond'})
        
      bycrypt.compare(req.body.password, users[0].password, function(err, result) {
        if (err) return res.json({status: false, message: 'login failed'})
        if (result) {
          var token = jwt.sign({ username: users[0].username }, secret, { expiresIn: '1h' })
          return res.json({status: result, message: 'login successful', token, username: users[0].username})
        } else {
          return res.json({status: false, message: 'wrong password'})
        }
      })
    } 
  )

})

app.post('/authen', jsonParser, function (req, res, next) {
  try {
    const token = req.headers.authorization.split(' ')[1]
    var decoede = jwt.verify(token, secret)
    res.json({status: 'ok', username: decoede.username})
  } catch(err) {
    res.json({status: 'erorr', message: err.message})
  }
})

app.listen(3333)