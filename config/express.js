var express = require('express');
//var wechat = require('../api/controllers/wechat.js');

module.exports.express = {

	bodyParser: function(){

		//get the default body parser from express
		//var defaultBodyParser = express.bodyParser(options);
		//var defaultBodyParser = sails.config.express.bodyParser();

		return function (req, res, next){

			//if there's no content type or is text/plain, parse the text
			if (!req.headers['Content-Type'] || req.headers['Content-Type'].match('text/plain')) {

				//set the flag as parsed (Express uses this _body flag to keep 
				//track of whether the request body
				// is already parsed so that it only gets parsed once.)
				//console.log('_body info: ' + req._body);
				req._body = true;
				var xml = '';

				req.setEncoding('utf8');
				req.on('data', function(chunk){
					xml += chunk;
				});
				req.on('end', function(){
					//console.log("自己的express获得的数据：" + xml);
					req.rawBody = xml;
					//req.body = xml;
					//req.body = wechat.toJSON(xml);
					next();
				});
			} else {
				next();
				//return defult body parser
				//return defaultBodyParser(req, res, next);
			}
		};
	}
};