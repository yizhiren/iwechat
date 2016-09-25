var iWechat = require('../');
var wechat = new iWechat();
var minirequest = require('../src/requestAdapter');
var request = new minirequest();
var fs = require('fs');
var path = require('path');
var express = require('express');
var app = express.createServer();
var Share = require('./share');
var assert = require('assert');
require('./server');
//app.use(express.static(path.join(__dirname, '')));
var result = {}

result.scan = 1;
wechat.on('scan',
function() {
    console.log('scan ok.');
    delete result.scan;
})

result.confirm = 1;
wechat.on('confirm',
function() {
    console.log('confirm ok.');
    delete result.confirm;
})

result.contactinfo = 1;
wechat.on('contactinfo',
function(prop) {
    assert(prop.uuid == Share.UUID);
    assert(prop.uin == Share.WXUIN);
    assert(prop.sid == Share.WXSID);
    assert(prop.skey == Share.SKEY);
    assert(prop.passTicket == Share.PASS_TICKET);

    assert(prop.wxuin == Share.WXUIN);
    assert(prop.wxsid == Share.WXSID);
    assert(prop.pass_ticket == Share.PASS_TICKET);

    assert(prop.baseRequest.Uin == Share.WXUIN);
    assert(prop.baseRequest.Sid == Share.WXSID);
    assert(prop.baseRequest.Skey == Share.SKEY);

    assert(prop.webwxDataTicket == Share.DATATICKET);

    delete result.contactinfo;
})

result.selfinfo = 1;
wechat.on('selfinfo',
function(info) {
    assert(info.Uin == Share.WXUIN);
    assert(info.Signature == Share.SIGNATURE);
    assert(info.Sex == 1);
    assert(info.NickName == Share.NICKNAME);
    assert(info.UserName == Share.USERNAMEHASH);

    delete result.selfinfo;
})

result.uuid = 1;
wechat.on('uuid',
function(uuid) {
    console.log('Get UUID:', uuid);
    assert(uuid, Share.UUID);
    var qrcodeUrl = 'https://login.weixin.qq.com/qrcode/' + uuid;
    console.log(qrcodeUrl);

    request.R({
        method: 'GET',
        url: qrcodeUrl
    }).then(function(res) {
        var explen = fs.lstatSync(path.join(__dirname, 'qrcode.jpg')).size;
        assert(res.raw.length == explen);
        delete result.uuid;
    }).
    catch(function(err) {
        assert(err == undefined);
        done();
    });
    assert(uuid == Share.UUID)

})

result['init-message'] = 1;
wechat.on('init-message',
function() {
    delete result['init-message'];
});

result['text-message'] = 1;
result['reply-text-message'] = 1;
result['get-friend-list'] = 1;
wechat.on('text-message',
function(msg) {
    assert('TEXT' == msg.Content);
    delete result['text-message'];
    
    wechat.sendMsg('content','user',function(err){
    	assert(!err);
    	delete result['reply-text-message'];
    })

    var friends = wechat.getFriendList();
    console.log(friends);
    assert(1 === friends.length);
    assert(Share.AnyFriend1 === friends[0].UserName);
    delete result['get-friend-list'];


});

describe('wechat event:',
function() {
    describe('test all:',
    function() {
        it('should get uuid:',
        function(done) {
            result.logout = 1;
            wechat.on('logout',
            function() {
                delete result.logout;
                assert(Object.keys(result).length == 0);
                done();
            })

        })
    });

});

/*
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







*/

wechat.start();
