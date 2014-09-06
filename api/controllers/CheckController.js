/**
 * CheckController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

 module.exports = {


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to CheckController)
   */
   //_config: {},

   /**
   * Check the signature from Tecent:
   * 加密/校验流程如下：
	 * 1. 将token、timestamp、nonce三个参数进行字典序排序
	 * 2. 将三个参数字符串拼接成一个字符串进行sha1加密
	 * 3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
   *
   * 然后做了个自动应答机器人回复
	 */

  wechat: function (req, res) {
    
    var wechat = require('./wechat.js');
    var util = require('util');
    var MENU_QUESTION = '您好，我是微信小秘书，很高兴为你服务。请直接输入 ？ 向我提问\n 或者：';
    var MENU_DEFAULT = '绑定用户网站账号（输入 bind, xxx@abc.com）; \n 推广信息(p);';
    var MENU_PROMOTION = '欢迎使用微信小秘书，本公司将向你推送promotion，请选择\n[1]yes接受\n[2]no下次再说';
    
    wechat.token = "jerrywechat123";

    if (req.method === 'GET'){
      wechat.checkSignature(req, res);
    }

    wechat.handler(res);

    if (req.method === 'POST'){
      
      console.log("req.method: " + req.method);
      console.log("Content-type: " + req.get('Content-Type'));
      console.log("req.originalUrl: " + req.originalUrl);
      console.log("22 :" + util.inspect(req.rawBody, { showHidden: true, depth: null }));

      wechat.toJSON(req.rawBody);
      
      // 第一个版本微信机器人自动应答；2014-05-01
      //监听文本信息
      /*wechat.text(function (data) {
        var msg = {
          FromUserName : data.ToUserName,
          ToUserName : data.FromUserName,
          //MsgType : "text",
          Content : '你好 - 杰瑞牌微信机器人自动应答\n 1. 亲，这个是点赞 \n 2. 想退出服务？不要啦 \n 3. 真的不要我啦？'
          //FuncFlag : 0
        };
        //回复信息    
        wechat.send(msg);
      });*/

      // 第二个版本，根据应答菜单回复，并且计入数据库；2014-05-10
      var responseMsg = {};
      var returndata = {};
      wechat.text(function (data) {
        var userinput = data.Content;
        if ( sails.config.weichatglobal.msgid !== data.MsgId){
          sails.config.weichatglobal.msgid = data.MsgId;
        } else{
          return;
        }
        
        // 解析用户input参数，规定如下：
        // 1. "bind, xxx@abc.com": 绑定用户OPENID到用户网站账号
        // 2. " ? " : 展示缺省菜单
        // 3. 其他未能识别字符 ： 显示帮助信息
        
        
        var csvutil = require('./csv_util.js');
        var userid = data.FromUserName;
        
        //added 2014-05-15, 解析用户信息，用golbal 变量遍历完成
        var users = sails.config.weichatglobal.users;
        console.log('users -> data length: ' + users.length);
        console.log('users -> message content: ' + JSON.stringify(users));
        for (var i=0; i<users.length; i++){
          if(users[i].customer_wechat_id === userid){
            returndata.campaign_id = users[i].campaign_id;
            returndata.marketing_message = users[i].marketing_message;

          }
        }

        responseMsg.FromUserName = data.ToUserName;
        responseMsg.ToUserName = data.FromUserName;

        if (userinput.substring(0, 4) === 'bind'){
          //用OPENID查询用户数据库，添加要绑定的属性
          responseMsg.Content = '绑定成功！';
        } else {
          var writeflag = true;
          switch(userinput) {
            case '？' || '?':
            responseMsg.Content = MENU_QUESTION + MENU_DEFAULT;
            break;

            case '1':
            responseMsg.Content = '您选择了yes，感谢接受我们的promotion！';

            //记录用户行为为接受，需要记录data.CreateTime+data.Content+data.FromUserName，写入csv文件
            //returndata.campaign_id = 'C0000000200';
            //returndata.campaign_id = sails.config.weichatglobal.campaign_id;
            returndata.customer_wechat_id = data.FromUserName;
            returndata.status = 'yes';
            returndata.create_time = data.CreateTime;
            //returndata.marketing_message = 'Promotion test via WeChat!';
            //returndata.marketing_message = sails.config.weichatglobal.marketing_message;
            console.log('invoke 1111111111');
            if(writeflag) {
              csvutil.appendcsv(returndata);
              writeflag = false;
            }
            break;

            case '2':
            responseMsg.Content = '您选择了no，感谢！我们将做的更好！';

            //记录用户行为为拒绝，需要记录data.CreateTime+data.Content+data.FromUserName，写入csv文件
            //returndata.campaign_id = 'C0000000200';
            //returndata.campaign_id = sails.config.weichatglobal.campaign_id;
            returndata.customer_wechat_id = data.FromUserName;
            returndata.status = 'no';
            returndata.create_time = data.CreateTime;
            //returndata.marketing_message = 'Promotion test via WeChat!';
            //returndata.marketing_message = sails.config.weichatglobal.marketing_message;
            console.log('invoke 22222222');
            if(writeflag) {
              csvutil.appendcsv(returndata);
              writeflag = false;
            }
            break;

            case 'p' || 'P':
            /*csvutil.readcsv(function(dt){
              //console.log('data length: ' + dt.length);
              //console.log('data message: ' + JSON.stringify(dt));
              for(var i=0; i<dt.length; i++){
                if(dt[i].customer_wechat_id === data.FromUserName){
                  //console.log('hello, here 111 ' + dt[i].marketing_message);
                  //responseMsg.Content = dt[i].marketing_message;
                  sails.config.weichatglobal.marketing_message = dt[i].marketing_message;
                  sails.config.weichatglobal.campaign_id = dt[i].campaign_id;
                }
              }

            });*/
            for (var j=0; j<users.length; j++){
              if(users[j].customer_wechat_id === userid){
                responseMsg.Content = users[j].marketing_message + '\n\n[1]yes接受\n[2]no下次再说';
              }
            }
            //responseMsg.Content = sails.config.weichatglobal.marketing_message;

            break;

            default:
            responseMsg.Content = MENU_DEFAULT;
          }
        }
        wechat.send(responseMsg);
      });

      //监听地理位置信息
      wechat.location(function (data) {
        var msg = {
          FromUserName : data.ToUserName,
          ToUserName : data.FromUserName,
          MsgType : "text",
          Content : '你娃原来在 《 ' + data.Label + ' 》 混啊，哈哈，被我发现了'
        };

        wechat.send(msg);
      });

    } // end of ( if req.method === 'POST')

  },

  /**
   * Action : /
   * 
  */
  index: function (req, res) {
    res.view('jerryhome/index');
  },

  /**
   * Get access token : /gettoken
   * 
  */
  gettoken: function (req, res) {
    var sendto = require('./sendtowechat.js');
    var access_token = '';

    if (sendto.accesstoken === ''){
      sendto.getAccessToken();
      
      sendto.token( function(data) {
        access_token = data.access_token;
        sendto.accesstoken = access_token;
        console.log('token : ' + access_token);

        // put the access token to global
        console.log('init global token is: ' + sails.config.weichatglobal.access_token);
        sails.config.weichatglobal.access_token = access_token;
        console.log('after global token is: ' + sails.config.weichatglobal.access_token);
        res.json(200, {token: access_token});
      });
      
    }

  },

  /**
   * Create group : /group
   * 
  */
  group: function(req, res) {

    var sendto = require('./sendtowechat.js');

    console.log('rawBody is :' + req.rawBody);
    //var rawdata1 = new Object(req.rawBody);

    //console.log('rawdata1: ' + rawdata1);
    //console.log('rawdata1 gname: ' + rawdata1.gname);
    var rawdata = req.rawBody;
    /*console.log('rawdata : ' + rawdata);
    console.log('rawdata gname is : ' + rawdata.gname);
    var temp = JSON.stringify(rawdata);
    console.log('after stringify: ' + temp);
    var tmpObj = JSON.parse(temp);
    console.log('11 after json parse' + tmpObj);
    var tmpObj1 = JSON.stringify(tmpObj);
    console.log('22 after json stringify' + tmpObj1);
    //var gname = tmpObj.gname;
    var tmpObj2 = JSON.parse(tmpObj1);
    console.log('33 tmpObj2.gname' + tmpObj2.gname);*/
    
    var obj = eval('(' + rawdata + ')');
    console.log('eval obj : ' + obj);
    console.log('eval obj gname is : ' + obj.gname);

    //var gname = rawdata.substring(6);
    var gname = obj.gname;
    console.log('input gname is: ' + gname);
    
    sendto.creategroup(gname);

    sendto.ctgroup( function(data){
      console.log('create group post back: ' + JSON.stringify(data));
      res.json(200, data);
    });

  },

  /**
   * Query group : /querygroup
   * 
  */
  querygroup: function(req, res) {
    var sendto = require('./sendtowechat.js');

    sendto.querygroup();
    sendto.qygroup( function(data){
      console.log('query group post back: ' + JSON.stringify(data));
      res.json(200, data);
    });
  },

  /**
   * Query user : /queryuser
   * 
  */
  queryuser: function(req, res) {
    var sendto = require('./sendtowechat.js');
    var rawdata = req.rawBody;
    var obj = eval('(' + rawdata + ')');
    var openid = obj.openid;

    sendto.queryuser(openid);
    sendto.qyuser( function(data){
      console.log('query user post back: ' + JSON.stringify(data));
      res.json(200, data);
    });
  },

  /**
   * Query Users 获取关注者列表 : /queryuser
   * 
  */
  queryUsers: function(req, res) {
    var sendto = require('./sendtowechat.js');

    sendto.queryUsers();
    sendto.qyusers( function(data){
      console.log('获取关注者列表的返回值: ' + JSON.stringify(data));
      res.json(200, data);
    });
  }

};
