/**
 * Created by Drew Lemmy, 2016
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

var krist = require('./../krist.js');

module.exports = function(app) {
	app.get('/cdel', function(req, res) {
		res.send("Connor dominates and penetrates Ryan Smith.");
	});

	app.get('/liggy', function(req, res) {
		res.header("Content-Type", "text/html");

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
	
	app.get('/iskristdead', function(req, res) {
		res.header("Content-Type", "application/json");
		
		res.send("{\"ok\":true,\"kristdead\":false}");
	});

	return app;
};
