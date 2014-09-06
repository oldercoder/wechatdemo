var GRANT_TYPE = 'client_credential';
var APPID = 'wx9991dc6581a60c21';
var APPSECRET = '747eaa9d5369d71f160a844b81545ec7';
var rest = require('restler');
var events = require('events');
var emitter = new events.EventEmitter();
emitter.setMaxListeners(50);

//get request
var getaccesstoken_url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=' + GRANT_TYPE + '&appid=' + APPID + '&secret=' + APPSECRET;
var querygroup_url = 'https://api.weixin.qq.com/cgi-bin/groups/get?access_token=';
var queryuser_url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=';
var queryusers_url = 'https://api.weixin.qq.com/cgi-bin/user/get?access_token=';

//post request
var customerservice_url = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=' + sails.config.weichatglobal.access_token;
var creategroup_url = 'https://api.weixin.qq.com/cgi-bin/groups/create?access_token=';

var sendtowechat = function() {
};

sendtowechat.prototype.accesstoken = '';

sendtowechat.prototype.getAccessToken = function(){

  rest.get(getaccesstoken_url).on('complete', function(data, response) {
      var tmpdata = JSON.stringify(data);
      //console.log('data is: ' + tmpdata);
      //console.log('token is: ' + JSON.parse(tmpdata).access_token);
      //console.log(' expires in : ' + JSON.parse(tmpdata).expires_in);
      
      emitter.emit("gottoken", JSON.parse(tmpdata));

      return JSON.parse(tmpdata).access_token;
  });
};

sendtowechat.prototype.token = function(callback) {
  emitter.on("gottoken", callback);
  return this;
};

sendtowechat.prototype.creategroup = function(gname){
  var group_structure = {
    "group": {"name": gname}
  };

  var url = creategroup_url + sails.config.weichatglobal.access_token;
  //console.log('the request url is: ' + url);
  //console.log('access token before ct group: ' + sails.config.weichatglobal.access_token);
  rest.postJson(url, group_structure).on('complete', function(data, response){
    var tmpdata = JSON.stringify(data);
    //console.log('ctgroup data: ' + tmpdata);
    emitter.emit("creategroup", JSON.parse(tmpdata));
  });

};

sendtowechat.prototype.ctgroup = function(callback) {
  emitter.on("creategroup", callback);
  return this;
};

sendtowechat.prototype.querygroup = function(gname){

  var url = querygroup_url + sails.config.weichatglobal.access_token;
  //console.log('the request url is: ' + url);
  rest.get(url).on('complete', function(data, response){
    var tmpdata = JSON.stringify(data);
    //console.log('qygroup data: ' + tmpdata);
    emitter.emit("querygroup", JSON.parse(tmpdata));
  });

};

sendtowechat.prototype.qygroup = function(callback) {
  emitter.on("querygroup", callback);
  return this;
};

sendtowechat.prototype.queryuser = function(idinput){

  var url = queryuser_url + sails.config.weichatglobal.access_token + '&openid=' + idinput + '&lang=zh_CN';
  //console.log('the request url is: ' + url);
  rest.get(url).on('complete', function(data, response){
    var tmpdata = JSON.stringify(data);
    //console.log('qygroup data: ' + tmpdata);
    emitter.emit("queryuser", JSON.parse(tmpdata));
  });

};

sendtowechat.prototype.qyuser = function(callback) {
  emitter.on("queryuser", callback);
  return this;
};

sendtowechat.prototype.queryUsers = function(){

  var url = queryusers_url + sails.config.weichatglobal.access_token;
  //console.log('the request url is: ' + url);
  rest.get(url).on('complete', function(data, response){
    var tmpdata = JSON.stringify(data);
    //console.log('qygroup data: ' + tmpdata);
    emitter.emit("queryusers", JSON.parse(tmpdata));
  });

};

sendtowechat.prototype.qyusers = function(callback) {
  emitter.on("queryusers", callback);
  return this;
};

module.exports = new sendtowechat();