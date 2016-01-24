var krist = require('./../src/krist.js');

module.exports = function(app) {
	app.get('/cdel', function(req, res) {
		res.send("Connor dominates and penetrates Ryan Smith.");
	});

	app.get('/liggy', function(req, res) {
		res.send("<!doctype html>" +
			"<html>" +
			"<head>" +
			"<title>LIGGY LIGGY LIGGY LIGGY</title>" +
			"<style>body { overflow: hidden; margin: 0; }</style>" +
			"</head>" +
			"<body>" +
			"<iframe width=\"420\" height=\"315\" src=\"https://www.youtube.com/embed/gSzgNRzpjo8?rel=0&autoplay=1\" frameborder=\"0\" allowfullscreen id=\"video\"></iframe>" +
			'<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>' +
			'<script>$(function(){$("#video").css({width:$(window).innerWidth()+"px",height:$(window).innerHeight()+"px"}),$(window).resize(function(){$("#video").css({width:$(window).innerWidth()+"px",height:$(window).innerHeight()+"px"})})});</script>' +
			"</body>" +
			"</html>");
	});
}