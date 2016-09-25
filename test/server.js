var express = require('express')
var path=require('path');
var fs = require('fs');
var Share=require('./share');
var assert=require('assert');

process.env.PROTOCOL = Share.PROTOCOL;
process.env.PORT = Share.PORT;
process.env.NODE_ENV = 'production'


var app =  ('https' == Share.PROTOCOL)?
	express.createServer({
	  key: fs.readFileSync(path.join(__dirname,'ssl/key.pem')),
	  cert: fs.readFileSync(path.join(__dirname,'ssl/cert.pem'))
	}):
	express.createServer();

app.use(express.bodyParser());

//////////////////////////


///////////////////////////
app.get('/',function(req,res){
	res.send("ok, worked!");
});



		app.get('/jslogin',function(req,res){	
			var query = req.query;
			console.log(req.method,req.url);

			assert(query.appid == 'wx782c26e4c19acffb'
			&& query.fun == 'new'
			&& query.lang == 'zh_CN');

			res.send(Share.UUID_CODE);



		});



		app.get('/qrcode/:uuid',function(req,res){	
			console.log(req.method,req.url);
			console.log('qrcode param=:',req.params)

			assert(Share.UUID == req.params.uuid);
			console.log('sendfile',path.join(__dirname,'qrcode_.jpg'));
			res.sendfile('qrcode_.jpg',{root:__dirname});

	
		})




		var checkscan_return =(function(){
			var idx=0;
			return {
				get:function(){
					return Share.CHECKSCAN[idx++];
				},
				index:function(){
					return idx;
				}

			};
		})();



		console.log('login.app.store');
		app.get('/cgi-bin/mmwebwx-bin/login',function(req,res){
			console.log(req.method,req.url);
			assert(req.query.loginicon === 'true'
				&& req.query.tip === '0'
				&& req.query.uuid === Share.UUID);
			var ret=checkscan_return.get();
			console.log('login ret:',ret);
			res.send(ret);	
			if(checkscan_return.index()>=Share.CHECKSCAN.length){

			}
			
		})



		app.get('/cgi-bin/mmwebwx-bin/webwxnewloginpage',function(req,res){
			console.log(req.method,req.url);

			assert(req.query.fun === 'new'
				&& req.query.version === 'v2'
				&& req.query.uuid === Share.UUID
				&& req.query.ticket === Share.TICKET
				&& req.query.scan === Share.SCANCODE);
			res.setHeader('Set-Cookie', Share.DATATICKET_COOKIE);
			res.send(Share.SESSIONINFO);

		})




		app.post('/cgi-bin/mmwebwx-bin/webwxinit', function(req,res){
			console.log(req.method,req.url);

			assert(Share.PASS_TICKET == req.query.pass_ticket
				&& Share.WXUIN == req.body.BaseRequest.Uin
				&& Share.WXSID == req.body.BaseRequest.Sid
				&& Share.SKEY == req.body.BaseRequest.Skey
				);
			res.send(JSON.stringify({
				"BaseResponse": {
				"Ret": 0,
				"ErrMsg": ""
				}
				,
				"Count": 2,
				"ContactList": [{
				"Uin": 0,
				"UserName": "filehelper",
				"NickName": "文件传输助手",
				"HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=646642307&username=filehelper&skey=@crypt_cd96f188_6e197aaf27f83dceda6d414cbc43f775",
				"ContactFlag": 3,
				"MemberCount": 0,
				"MemberList": [],
				"RemarkName": "",
				"HideInputBarFlag": 0,
				"Sex": 0,
				"Signature": "",
				"VerifyFlag": 0,
				"OwnerUin": 0,
				"PYInitial": "WJCSZS",
				"PYQuanPin": "wenjianchuanshuzhushou",
				"RemarkPYInitial": "",
				"RemarkPYQuanPin": "",
				"StarFriend": 0,
				"AppAccountFlag": 0,
				"Statues": 0,
				"AttrStatus": 0,
				"Province": "",
				"City": "",
				"Alias": "",
				"SnsFlag": 0,
				"UniFriend": 0,
				"DisplayName": "",
				"ChatRoomId": 0,
				"KeyWord": "fil",
				"EncryChatRoomId": ""
				}],
				"SyncKey": Share.SYNCKEY,
				"User": {
				"Uin": 733312840,
				"UserName": "@61caa0194e13d01b959547c100123456",
				"NickName": "DEMO",
				"HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=1974126281&username=@61caa0194e13d01b959547c100c04d9e&skey=@crypt_cd96f188_6e197aaf27f83dceda6d414cbc43f775",
				"RemarkName": "",
				"PYInitial": "",
				"PYQuanPin": "",
				"RemarkPYInitial": "",
				"RemarkPYQuanPin": "",
				"HideInputBarFlag": 0,
				"StarFriend": 0,
				"Sex": 1,
				"Signature": "懒惰驶得万年船",
				"AppAccountFlag": 0,
				"VerifyFlag": 0,
				"ContactFlag": 0,
				"WebWxPluginSwitch": 0,
				"HeadImgFlag": 1,
				"SnsFlag": 49
				}
				,
				"ChatSet": "filehelper,@2f225a6b41c5692790bdf5d7ab82f2a1,@82da2c9d9488425aa4538ab53f7a461a,@@dabc9490fb1cada576c585a99390c18c6b779f3ac03493dba1d38aba1982784c,@3d4cf053866bc4200333f4796a282e4141615a6d18f9281d56dc69f7e0a22b3a,@@8528955fb52d567051efaf5173eb5f8a7f15dd16f7968cb45e443aa07571d5c2,fmessage,@@99707c2608761bd1d3891950fadb2462efb7f6efec4901b361c89353c2f4ed42,@@912dd466b510d4b546a1bbbaafa704b76007cac3830606ffbab40b38fb684379,@@6d53a671c83e0df562870bdfc42e8c9d920202c76d9778c15c893d068076ed59,weixin,",
				"SKey": "@crypt_cd96f188_6e197aaf27f83dceda6d414cbc43f775",
				"ClientVersion": 369299473,
				"SystemTime": 1467439909,
				"GrayScale": 1,
				"InviteStartCount": 40,
				"MPSubscribeMsgCount": 1,
				"ClickReportInterval": 600000
				})
			);


		})




		app.post('/cgi-bin/mmwebwx-bin/webwxstatusnotify',function(req,res){
			console.log(req.method,req.url);

			assert( Share.PASS_TICKET == req.query.pass_ticket
				&& Share.WXUIN == req.body.BaseRequest.Uin
				&& Share.WXSID == req.body.BaseRequest.Sid
				&& Share.SKEY == req.body.BaseRequest.Skey
				&& 3 == req.body.Code
				&& Share.USERNAMEHASH == req.body.FromUserName
				&& Share.USERNAMEHASH == req.body.ToUserName);
			res.send(JSON.stringify({
				"BaseResponse": {
					"Ret": 0,
					"ErrMsg": ""
				}
				,
				"MsgID": "1234"}));

		})




		app.post('/cgi-bin/mmwebwx-bin/webwxgetcontact',function(req,res){
			console.log(req.method,req.url);

			assert(Share.PASS_TICKET == req.query.pass_ticket
				&& 0 == req.query.seq
				&& Share.SKEY == req.query.skey);
			res.send(JSON.stringify({
					"BaseResponse": {
					"Ret": 0,
					"ErrMsg": ""
					}
					,
					"MemberCount": 1,
					"MemberList": [{
					"Uin": 0,
					"UserName": "gh_22b87fa7cb3c",
					"NickName": "语音提醒",
					"HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=1340088&username=gh_22b87fa7cb3c&skey=@crypt_cd96f188_6e197aaf27f83dceda6d414cbc43f775",
					"ContactFlag": 67,
					"MemberCount": 0,
					"MemberList": [],
					"RemarkName": "",
					"HideInputBarFlag": 0,
					"Sex": 0,
					"Signature": "向我发送语音消息即可设置提醒。",
					"VerifyFlag": 24,
					"OwnerUin": 0,
					"PYInitial": "YYDX",
					"PYQuanPin": "yuyindixing",
					"RemarkPYInitial": "",
					"RemarkPYQuanPin": "",
					"StarFriend": 1,
					"AppAccountFlag": 0,
					"Statues": 0,
					"AttrStatus": 0,
					"Province": "广东",
					"City": "广州",
					"Alias": "voicereminder",
					"SnsFlag": 0,
					"UniFriend": 0,
					"DisplayName": "",
					"ChatRoomId": 0,
					"KeyWord": "gh_",
					"EncryChatRoomId": ""
          },{
					"Uin": 0,
					"UserName": Share.AnyFriend1,
					"NickName": "any user 1",
					"HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=1340088&username=gh_22b87fa7cb3c&skey=@crypt_cd96f188_6e197aaf27f83dceda6d414cbc43f775",
					"ContactFlag": 67,
					"MemberCount": 0,
					"MemberList": [],
					"RemarkName": "",
					"HideInputBarFlag": 0,
					"Sex": 0,
					"Signature": "向我发送语音消息即可设置提醒。",
					"VerifyFlag": 0,
					"OwnerUin": 0,
					"PYInitial": "YYDX",
					"PYQuanPin": "yuyindixing",
					"RemarkPYInitial": "",
					"RemarkPYQuanPin": "",
					"StarFriend": 1,
					"AppAccountFlag": 0,
					"Statues": 0,
					"AttrStatus": 0,
					"Province": "广东",
					"City": "广州",
					"Alias": "voicereminder",
					"SnsFlag": 0,
					"UniFriend": 0,
					"DisplayName": "",
					"ChatRoomId": 0,
					"KeyWord": "gh_",
					"EncryChatRoomId": ""
          }],
					"Seq": 0
				}) );


		})




		app.post('/cgi-bin/mmwebwx-bin/webwxbatchgetcontact',function(req,res){
			console.log(req.method,req.url);

			assert(Share.PASS_TICKET == req.query.pass_ticket
					&&'ex' == req.query.type
					&& Share.WXUIN == req.body.BaseRequest.Uin
					&& Share.WXSID == req.body.BaseRequest.Sid
					&& Share.SKEY == req.body.BaseRequest.Skey
					&& req.body.Count >= 0
					&& (req.body.List instanceof Array)
					);
			res.send( JSON.stringify({
					"BaseResponse": {
					"Ret": 0,
					"ErrMsg": ""
					}
					,
					"Count": 1,
					"ContactList": [
					{
					"Uin": 0,
					"UserName": "@@6d53a671c83e0df562870bdfc42e8c9d920202c76d9778c15c893d068076ed59",
					"NickName": "318的你",
					"HeadImgUrl": "/cgi-bin/mmwebwx-bin/webwxgetheadimg?seq=639423837&username=@@6d53a671c83e0df562870bdfc42e8c9d920202c76d9778c15c893d068076ed59&skey=",
					"ContactFlag": 3,
					"MemberCount": 1,
					"MemberList": [{
					"Uin": 0,
					"UserName": "@13582ccee52aae578728765d2387fa50",
					"NickName": "任在囧途",
					"AttrStatus": 101477,
					"PYInitial": "",
					"PYQuanPin": "",
					"RemarkPYInitial": "",
					"RemarkPYQuanPin": "",
					"MemberStatus": 0,
					"DisplayName": "任盈锋",
					"KeyWord": "ren"
					}],
					"RemarkName": "",
					"HideInputBarFlag": 0,
					"Sex": 0,
					"Signature": "",
					"VerifyFlag": 0,
					"OwnerUin": 4338565,
					"PYInitial": "318DN",
					"PYQuanPin": "318deni",
					"RemarkPYInitial": "",
					"RemarkPYQuanPin": "",
					"StarFriend": 0,
					"AppAccountFlag": 0,
					"Statues": 0,
					"AttrStatus": 0,
					"Province": "",
					"City": "",
					"Alias": "",
					"SnsFlag": 0,
					"UniFriend": 0,
					"DisplayName": "",
					"ChatRoomId": 0,
					"KeyWord": "",
					"EncryChatRoomId": "@be8b2798b549fe1c85e1b4fa16816aa2"
					}
					]})
				);

		})



		var synccheck_return =(function(){
			var idx=0;
			return {
				get:function(){
					if(idx >= Share.SYNCCHECK.length){
						return Share.SYNCCHECK[Share.SYNCCHECK.length-1];
					}
					return Share.SYNCCHECK[idx++];
				},

				index:function(){
					return idx;
				}

			}
		})();

		function makeSyncKey(keys){
		    var synckeylist = []
		    for (var e = keys['List'], o = 0, n = e.length; n > o; o++) {
		        synckeylist.push(e[o]['Key'] + '_' + e[o]['Val'])
		    }
		    return synckeylist.join('|');
		}


		app.get('/cgi-bin/mmwebwx-bin/synccheck',function(req,res){
			console.log(req.method,req.url);

			assert( Share.WXUIN == req.query.uin
				&& Share.WXSID == req.query.sid
				&& Share.SKEY == req.query.skey
				&& makeSyncKey(Share.SYNCKEY) == req.query.synckey
			);
			res.send(synccheck_return.get());
			if(synccheck_return.index()>=Share.SYNCCHECK.length){
	
			}
			
		})





		app.post('/cgi-bin/mmwebwx-bin/webwxsync',function(req,res){
			console.log(req.method,req.url);

			assert( Share.PASS_TICKET == req.query.pass_ticket
					&& Share.WXSID == req.query.sid
					&& Share.SKEY == req.query.skey
					&& Share.WXUIN == req.body.BaseRequest.Uin
					&& Share.WXSID == req.body.BaseRequest.Sid
					&& Share.SKEY == req.body.BaseRequest.Skey
					&& Share.SYNCKEY.Count ==  req.body.SyncKey.Count
				);
			var newSyncKey={
					"Count": 5,
					"List": [{
					"Key": 1,
					"Val": 654097265
					}
					,{
					"Key": 2,
					"Val": 654097994
					}
					,{
					"Key": 3,
					"Val": 654097969
					}
					,{
					"Key": 11,
					"Val": 654097037
					},{
					"Key": 12,
					"Val": 654097036
					}]
					};
			Share.SYNCKEY=newSyncKey;
			res.send(JSON.stringify({
					"BaseResponse": {
					"Ret": 0,
					"ErrMsg": ""
					}
					,
					"AddMsgCount": Share.MSGLIST.length,
					"AddMsgList": Share.MSGLIST,
					"ModContactCount": 0,
					"ModContactList": [],
					"DelContactCount": 0,
					"DelContactList": [],
					"ModChatRoomMemberCount": 0,
					"ModChatRoomMemberList": [],
					"Profile": {
					"BitFlag": 0,
					"UserName": {
					"Buff": ""
					}
					,
					"NickName": {
					"Buff": ""
					}
					,
					"BindUin": 0,
					"BindEmail": {
					"Buff": ""
					}
					,
					"BindMobile": {
					"Buff": ""
					}
					,
					"Status": 0,
					"Sex": 0,
					"PersonalCard": 0,
					"Alias": "",
					"HeadImgUpdateFlag": 0,
					"HeadImgUrl": "",
					"Signature": ""
					}
					,
					"ContinueFlag": 0,
					"SyncKey":newSyncKey 
					,
					"SKey": ""
					}));

		})

		app.post('/cgi-bin/mmwebwx-bin/webwxlogout',function(req,res){
			console.log(req.method,req.url);
			assert(Share.SKEY == req.query.skey
				&& 0 == req.query.type
				&& 1 == req.query.redirect
				&& Share.WXUIN == req.body.uin
				&& Share.WXSID == req.body.sid);
			res.setHeader('Set-Cookie','wxsid=; Path=/; Expires=Thu, 01-Jan-1970 00:00:30 GMT');
			res.send(200);
		})

                             app.post('/cgi-bin/mmwebwx-bin/webwxsendmsg',function(req,res){
                                           console.log(req.method,req.url);
                                            assert(Share.PASS_TICKET == req.query.pass_ticket
                                                && Share.WXUIN == req.body.BaseRequest.Uin
                                                && Share.WXSID == req.body.BaseRequest.Sid
                                                && Share.SKEY == req.body.BaseRequest.Skey
                                                && 1 == req.body.Msg.Type
                                                && req.body.Msg.Content
                                                && req.body.Msg.FromUserName
                                                && req.body.Msg.LocalID
                                                && req.body.Msg.ClientMsgId)
                                            res.send(JSON.stringify({
                                                "BaseResponse": {
                                                "Ret": 0,
                                                "ErrMsg": ""
                                                }
                                            }));
                             })

app.listen(Share.PORT);
console.log('listening',Share.PORT);






