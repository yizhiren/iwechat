var iWechat = require('../');
var wechat = new iWechat()
var minirequest = require('poorequest');
var request = new minirequest();
var fs=require('fs');
var path = require('path')
var express = require('express')
var app =  express.createServer();

app.use(express.static(path.join(__dirname, '')));
wechat.start();

wechat.on('uuid', function(uuid)  {
	console.log('uuid:', uuid);
	var qrcodeUrl = 'https://login.weixin.qq.com/qrcode/' + uuid;
	console.log(qrcodeUrl);
	request.get(qrcodeUrl, function(err,res){
		if(err){
			console.log(err);
		}else{
			fs.writeFileSync('qrcode.jpg',res.raw);
			app.listen(1234)
		}
	})
	
})
wechat.on('scan', function()  {
	console.log('scan ok.');
})
wechat.on('confirm', function (){
	console.log('confirm ok!')
})
wechat.on('login', function(memberList)  {
	console.log('login ok. friends nums:', memberList.length);
	for(var i=0;i<memberList.length;i++){
		console.log(memberList[i].NickName+'('+memberList[i].RemarkName+')')
	}
})
wechat.on('logout', function(fmsg) {
	console.log('logout:',fmsg);
})
wechat.on('error', function(err){
	console.log('error:',err);
});

wechat.on('init-message', function(){
	console.log('init-message');
})
wechat.on('text-message', function(msg) {
	console.log('text-message',msg);
})
wechat.on('picture-message', function(msg) {
	console.log('picture-message',msg);
})
wechat.on('voice-message', function(msg) {
	console.log('voice-message',msg);
})
wechat.on('emoticon-message', function(msg) {
	console.log('emoticon-message',msg);
})
wechat.on('verify-message', function(msg) {
	console.log('verify-message',msg);
})


////////////////////////////////////////////////















