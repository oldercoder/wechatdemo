/**
* 一个主JavaScript类，完成微信7种事件的监听
*
**/

var crypto = require('crypto');
var xml2js = require('xml2js');
var events = require('events');
var emitter = new events.EventEmitter();
emitter.setMaxListeners(50);

var wechat = function() {
};

wechat.prototype.token = '';

//检验 token
wechat.prototype.checkSignature = function(req, res) {
  if (req.method === 'GET') {

    var signature = req.param("signature");
    var timestamp = req.param("timestamp");
    var nonce = req.param("nonce");
    var echostr = req.param("echostr");

    var sha1 = crypto.createHash('sha1');
    var sha1Str = sha1.update([this.token, timestamp, nonce].sort().join('')).digest('hex');
    console.log("sha1Str: " + sha1Str);
    console.log("signature: " + signature);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end((sha1Str === signature) ? echostr : '');
    return res;
  }
};

var RES;//存储要返回的响应

//预处理器
wechat.prototype.handler = function(res) {
  RES = res;
  /*var xml = '';
  var self = this;

  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    xml += chunk;
  });

  req.on('end', function() {
    console.log("接收到的腾讯消息：" + xml);
    self.toJSON(xml);
  });*/
};

//解析器
wechat.prototype.toJSON = function(xml) {
  var msg = {};

  xml2js.parseString(xml, function (err, result) {

    //console.log("接收到的解析后的JSON腾讯消息：" + result.xml);
    //var data = result;
    var data = result.xml;

    msg.ToUserName = data.ToUserName[0];
    msg.FromUserName = data.FromUserName[0];
    msg.CreateTime = data.CreateTime[0];
    msg.MsgType = data.MsgType[0];

    switch(msg.MsgType) {
      case 'text' :
      msg.Content = data.Content[0];
      msg.MsgId = data.MsgId[0];

      emitter.emit("text", msg);
      break;

      case 'image' :
      msg.PicUrl = data.PicUrl[0];
      msg.MsgId = data.MsgId[0];
      msg.MediaId = data.MediaId[0];

      emitter.emit("image", msg);
      break;

      case 'location' :
      msg.Location_X = data.Location_X[0];
      msg.Location_Y = data.Location_Y[0];
      msg.Scale = data.Scale[0];
      msg.Label = data.Label[0];
      msg.MsgId = data.MsgId[0];

      emitter.emit("location", msg);
      break;

      case 'link' :
      msg.Title = data.Title[0];
      msg.Description = data.Description[0];
      msg.Url = data.Url[0];
      msg.MsgId = data.MsgId[0];

      emitter.emit("link", msg);
      break;

      case 'event' :
      msg.Event = data.Event[0];
      if(msg.Event !== 'LOCATION'){
        msg.EventKey = data.EventKey[0];
      }
      
      emitter.emit("event", msg);
      break;

      case 'voice' :
      msg.MediaId = data.MediaId[0];
      msg.Format = data.Format[0];
      msg.MsgId = data.MsgId[0];
      msg.Recognition = data.Recognition[0];

      emitter.emit("voice", msg);
      break;

      case 'video' :
      msg.MediaId = data.MediaId[0];
      msg.ThumbMediaId = data.ThumbMediaId[0];
      msg.MsgId = data.MsgId[0];

      emitter.emit("video", msg);
      break;
    }
  });
  return msg;
};

//监听文本信息
wechat.prototype.text = function(callback) {
  emitter.on("text", callback);
  return this;
};

//监听图片信息
wechat.prototype.image = function(callback) {
  emitter.on("image", callback);
  return this;
};

//监听地址信息
wechat.prototype.location = function(callback) {
  emitter.on("location", callback);
  return this;
};

//监听链接信息
wechat.prototype.link = function(callback) {
  emitter.on("link", callback);
  return this;
};

//监听事件信息
wechat.prototype.event = function(callback) {
  emitter.on("event", callback);
  return this;
};

//监听语音信息
wechat.prototype.voice = function(callback) {
  emitter.on("voice", callback);
  return this;
};

//监听视频信息
wechat.prototype.video = function(callback) {
  emitter.on("video", callback);
  return this;
};

//监听所有信息
wechat.prototype.all = function(callback) {
  emitter.on("text", callback);
  emitter.on("image", callback);
  emitter.on("location", callback);
  emitter.on("link", callback);
  emitter.on("event", callback);
  emitter.on("voice", callback);
  emitter.on("video", callback);

  return this;
};

//将 js 组装成 xml
wechat.prototype.toXML = function(data) {
  //自动检测 MsgType
  var MsgType = "";
  if (!data.MsgType) {
    if (data.hasOwnProperty("Content")) MsgType = "text";
    if (data.hasOwnProperty("MusicUrl")) MsgType = "music";
    if (data.hasOwnProperty("Articles")) MsgType = "news";
  } else {
    MsgType = data.MsgType;
  }

  var msg = "" +
  "<xml>" +
  "<ToUserName><![CDATA[" + data.ToUserName + "]]></ToUserName>" +
  "<FromUserName><![CDATA[" + data.FromUserName + "]]></FromUserName>" +
  "<CreateTime>" + Date.now()/1000 + "</CreateTime>" +
  "<MsgType><![CDATA[" + MsgType + "]]></MsgType>" +
  "<FuncFlag>" + (data.FuncFlag || 0) + "</FuncFlag>";

  switch(MsgType) {
    case 'text' :
    msg += "" +
    "<Content><![CDATA[" + (data.Content || '') + "]]></Content>" +
    "</xml>";
    return msg;

    case 'music' :
    msg += "" +
    "<Music>" +
    "<Title><![CDATA[" + (data.Title || '') + "]]></Title>" +
    "<Description><![CDATA[" + (data.Description || '') + "]]></Description>" +
    "<MusicUrl><![CDATA[" + (data.MusicUrl || '') + "]]></MusicUrl>" +
    "<HQMusicUrl><![CDATA[" + (data.HQMusicUrl || data.MusicUrl || '') + "]]></HQMusicUrl>" +
    "</Music>" +
    "</xml>";
    return msg;

    case 'news' :
    var ArticlesStr = "";
    var ArticleCount = data.Articles.length;
    for (var i in data.Articles) {
      ArticlesStr += "" +
      "<item>" +
      "<Title><![CDATA[" + (data.Articles[i].Title || '') + "]]></Title>" +
      "<Description><![CDATA[" + (data.Articles[i].Description || '') + "]]></Description>" +
      "<PicUrl><![CDATA[" + (data.Articles[i].PicUrl || '') + "]]></PicUrl>" +
      "<Url><![CDATA[" + (data.Articles[i].Url ||'') + "]]></Url>" +
      "</item>";
    }

    msg += "<ArticleCount>" + ArticleCount + "</ArticleCount><Articles>" + ArticlesStr + "</Articles></xml>";
    return msg;
  }
};

//回复消息
wechat.prototype.send = function(data) {
  //RES.writeHead(200, {'Content-Type': 'text/plain'});
  RES.end(this.toXML(data));
  return RES;
};

module.exports = new wechat();