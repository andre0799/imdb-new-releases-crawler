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

var Firebase = require("firebase");
var ref = new Firebase("https://imdbbot.firebaseio.com/");
var chatsRef = ref.child("chats");
var moviesRef = ref.child("movies");

var __dirname = 'crawler_content'

var server_started = false

if(!server_started) {
	var app = express()

	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())

	app.set('port', process.env.PORT || 3000);

	app.get('/', function(req, res){
		moviesRef.once('value', function(data){
			var moviesObj = data.val()
			var updatedAt = moviesObj.updatedAt
			var moviesCollection = moviesObj.collection

			var chat_id = req.query.chat_id
			if(!chat_id){
				res.send("No chat id")
				return
			}

			sendMoviesWithScore(chat_id, moviesCollection)
			
			res.send(moviesObj)
		})
	})

	app.post('/register', function(req, res){
		var chat_id = req.body.chat_id || -137023455
		var score = req.body.score || 7

		var model = {}
		model[chat_id] = score
		chatsRef.update(model, function(){
			res.send("Registered chatId:"+chat_id)
		})

	})

	http.createServer(app).listen(app.get('port'), function(){
	  console.log("Express server listening on port " + app.get('port'));
	});
	
	server_started = true
}

var shouldSendNewReleases = function(){
	returnMovies(function(results){

		moviesRef.once('value', function(data){
			var moviesObj = data.val()
			var updatedAt = moviesObj.updatedAt
			var moviesCollection = moviesObj.collection

			// var newMovies = moviesCollection
			var newMovies = results.filter(function(movie){
				return !_.where(moviesCollection, {url: movie.url}).length
			})

			moviesRef.update({updatedAt: new Date(), collection: results})

			if(!newMovies.length) return

			chatsRef.once('value', function(data) {
				var chatsObj = data.val()
				for (var key in chatsObj) {
				  if (chatsObj.hasOwnProperty(key)) {
				    sendMoviesWithScore(key, newMovies)
				  }
				}
			})
		})
	})
}

shouldSendNewReleases()

setInterval(function(){
	shouldSendNewReleases()
}, (1000 * 60 * 60 * 24))

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
	    	var year = crEl.find(".info b .year_type").text()
	    	var image = crEl.find(".image img").attr("src")
	    	var duration = crEl.find(".info .item_description span").text().replace(/["'()\.]/g,"");
	    	var url = "http://www.imdb.com"+crEl.find(".info b a").attr("href")
	    	results.push({
	    		rating: rating, 
	    		title: title, 
	    		image: image, 
	    		url: url,
	    		year: year,
	    		duration: duration
	    	})
	    })

	    callback(results)
	  }
	});
}

var sendMoviesWithScore =  function(chat_id, moviesCollection){
	ref.child("chats/"+chat_id).once("value", function(data){
		var rating = data.val()

		moviesCollection.map(function(movie){
		if(movie.rating < rating) return
		request.post(
	    'https://api.telegram.org/bot180187171:AAEVe8KA1fdah9MY79NgbVgBQfcIdjBoO88/sendMessage',
		    {form: { 
		    	chat_id: chat_id, 
		    	text: "<a href=\'"+movie.image+"\'>"+"@imdb"+"</a>\n<b>"+movie.title+" "+movie.year+"</b>\n"+movie.duration+" &#9733;"+movie.rating+" <a href=\'"+movie.url+"\'>"+"IMDB"+"</a>", parse_mode: 'HTML'}},
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            // console.log(body)
		        }
		    }
		);
		})

	})
}