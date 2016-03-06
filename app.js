var Crawler = require("simplecrawler");
var fs = require("node-fs"),
        url = require("url"),
        path = require("path"),
        jsdom = require('jsdom'),
  		request = require('request'),
  		http = require('http'),
  		express = require('express'),
  		_ = require('underscore'),
  		jsonfile = require('jsonfile'),
  		bodyParser = require('body-parser');

var url = "http://www.imdb.com/sections/dvd/?ref_=nv_tvv_dvd_6"

var __dirname = 'crawler_content'

var server_started = false

if(!server_started) {
	var app = express()

	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())

	app.set('port', process.env.PORT || 3000);

	app.get('/', function(req, res){
		returnMovies(function(results){
			jsonfile.readFile('./movies.json', function(err, obj) {
			  res.send(obj)
			})
		})
	})

	app.post('/register', function(req, res){
		console.log("===========")
		console.log(req.body)
		console.log("===========")
		var chat_id = req.body.chat_id
		console.log('funciona memo')
		jsonfile.readFile('./users.json', function(err, obj) {
		  var users = obj.users
		  users[chat_id] = true
		  jsonfile.writeFile('./users.json', {updatedAt: new Date(), users: users}, function() {});
		})
		res.send({status: '200', message: 'funciona memo!'})
	})

	http.createServer(app).listen(app.get('port'), function(){
	  console.log("Express server listening on port " + app.get('port'));
	});
	
	server_started = true
}


setInterval(function(){
	returnMovies(function(results){
		jsonfile.writeFile('./movies.json', {updatedAt: new Date(), movies: results}, function() {});
	})
}, (1000 * 15))

var returnMovies = function(callback){
	var results = []

	jsdom.env({
	  url: url,
	  scripts: ["http://code.jquery.com/jquery.js"],
	  done: function (err, window) {
	    window.$('.list_item').each(function(index){
	    	var crEl = window.$(this)
	    	var rating = crEl.find(".rating-rating .value").text()
	    	var title = crEl.find(".info b a").text()
	    	results.push({rating: rating, title: title})
	    })

	    callback(results)
	  }
	});
}