var csv = require('csv');
//var events = require('events');
//var emitter = new events.EventEmitter();
//emitter.setMaxListeners(50);
csv_util = function() {

};

function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push(json[key]);
    });
    return result;
}

csv_util.prototype.readcsv = function(callback){
	var obj = [];
	csv()
		.from.path('./unica_from.csv')
		.transform( function(row){
        row.unshift(row.pop());
        return row;
    })
		.on('record', function(row,index){
			var msg = {};
			if(index > 0){
        //campaign_id,customer_wechat_id,marketing_message
        msg.campaign_id = row[1];
        msg.customer_wechat_id = row[2];
        msg.marketing_message = row[0];
        //console.log('record: '+ index + JSON.stringify(msg));
        obj.push(msg);
			}
		})
		.on('end', function(count){
			//console.log('Number of lines: '+count);
			//console.log('11 the object array is' + JSON.stringify(obj));
			//return obj;
			callback(obj);
		})
		.on('error', function(error){
        console.log(error.message);
    });
};

/*csv_util.prototype.readcsv = function(){
	var obj = [];
	csv()
		.from.path('./unica_from.csv')
		.transform( function(row){
        row.unshift(row.pop());
        return row;
    })
		.on('record', function(row,index){
			var msg = {};
			if(index > 0){
        //campaign_id,customer_wechat_id,marketing_message
        msg.campaign_id = row[1];
        msg.customer_wechat_id = row[2];
        msg.marketing_message = row[0];
        //console.log('record: '+ index + JSON.stringify(msg));
        obj.push(msg);
			}
		})
		.on('end', function(count){
			//console.log('Number of lines: '+count);
			//console.log('11 the object array is' + JSON.stringify(obj));
			//return obj;
			emitter.emit("gotfile", obj);
		})
		.on('error', function(error){
        console.log(error.message);
    });
};

csv_util.prototype.initfile = function(callback){
	emitter.on("gotfile", callback);
	return this;
};*/

csv_util.prototype.appendcsv = function(data){
	var writedata = json2array(data);

	console.log('befor write: ' + writedata.toString());
	csv()
		.from('\n' + writedata.toString())
		.to('./unica_to.csv', {flags:'a', eof: true})
		.on('error', function(error){
        console.log(error.message);
    });
	console.log('after write.');
	//return this;
};

module.exports = new csv_util();