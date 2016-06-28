/**
should.js:https://github.com/tj/should.js
mocha.js:https://cnodejs.org/topic/516526766d38277306c7d277

cd test
..\node_modules\.bin\mocha

**/

var iWechat = require('../');
var wechat = new iWechat();
var minirequest = require('poorequest');
var request = new minirequest();
var fs=require('fs');
var path = require('path');
var express = require('express');
var should = require('should');
var app =  express.createServer();
var Share=require('./share');
require('./server');
//app.use(express.static(path.join(__dirname, '')));



wechat.start();


describe('wechat basic:', function(){
	describe('test uuid:', function(){
		it('should get uuid:',function(done){
			wechat.on('uuid',function(uuid){
				should(uuid).eql(Share.UUID);
				var qrcodeUrl = 'https://login.weixin.qq.com/qrcode/' + uuid;
				console.log(qrcodeUrl);

				request.get(qrcodeUrl, function(err,res){
					should(err).eql(undefined);					
					should(res.raw.length).eql(100);
					done();
				})

			})

		})


	})



});














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
	var fromUser = msg.FromUserName;
	var msgContent = msg.Content;
	if(fromUser.substr(0,2) == '@@'){
		console.log('text-message', 'from group', msgContent);
	}else{
		console.log('text-message', 'from friend', msgContent);
		wechat.sendMsg(msgContent+msgContent,fromUser);
	}
	
	//
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















