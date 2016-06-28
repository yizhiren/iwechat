var express = require('express')
var fs = require('fs');
var Share=require('./share');
var app =  express.createServer({
  key: fs.readFileSync('ssl/key.pem'),
  cert: fs.readFileSync('ssl/cert.pem')
});

//////////////////////////


///////////////////////////
app.get('/',function(req,res){
	res.send("ok, worked!");
});


app.get('/jslogin',function(req,res){	
	var query = req.query;
	    var params = {
        'appid': 'wx782c26e4c19acffb',
        'fun': 'new',
        'lang': 'zh_CN'
    }
    console.log(query);
	if(query.appid == 'wx782c26e4c19acffb'
		&& query.fun == 'new'
		&& query.lang == 'zh_CN'){
		console.log('send uuid',Share.UUID_CODE);
		res.send(Share.UUID_CODE);
	}else{
		console.log('unexpected uuid request param');
		res.send('x');
	}

});

app.get('/qrcode/:uuid',function(req,res){	
	console.log('qrcode:',req.params)

});


app.listen(443,function(err){
	if(err)console.log(err)
	else console.log('listening https 443...')
});




process.env.NODE_ENV = 'production'

