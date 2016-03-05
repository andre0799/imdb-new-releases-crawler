var Crawler = require("simplecrawler");
var fs = require("node-fs"),
        url = require("url"),
        path = require("path"),
        jsdom = require('jsdom'),
  		request = require('request'),
  		http = require('http'),
  		express = require('express'),
  		_ = require('underscore');

var url = "http://www.imdb.com/sections/dvd/?ref_=nv_tvv_dvd_6"

var __dirname = 'crawler_content'

// var app = express()


// app.set('port', process.env.PORT || 3000);

var returnMovies = function(callback){
	var results = []

	console.log("FOrever Processs")

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

// app.get('/', function(req, res){
// 	returnMovies(function(results){
// 		res.send(results)
// 	})
// })

// http.createServer(app).listen(app.get('port'), function(){
//   console.log("Express server listening on port " + app.get('port'));
// });