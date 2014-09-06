module.exports = function (req, res, next) {
	console.log("installed customMiddleware is used");
	var xml = '';
	req.setEncoding('utf8');
	req.on('data', function (chunk) {
		xml += chunk;
	});

	req.on('end', function() {
		console.log("接收到的腾讯消息：" + xml);
		//self.toJSON(xml);
		req.body = xml;
	});
	next();
};