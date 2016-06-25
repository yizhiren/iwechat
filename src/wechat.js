'use strict'
var Promise = require('promise');
var util = require('util');
var events = require('events');
var fs = require('fs');
var path = require('path');
var PROP = "____PROP";
var API = "____API";
var debug = require('debug')('wechat')
var updateAPI = require('./utils').updateAPI
var CONF = require('./utils').CONF
var convertEmoji = require('./utils').convertEmoji
var contentPrase = require('./utils').contentPrase
var Request = require('./requestAdapter.js');
var mime = require('mime');
var querystring = require('querystring');

function Wechat() {
    function init_class() {
        var self = this;
        Wechat.super_.call(self);
        self[PROP] = {
            uuid: '',
            uin: '',
            sid: '',
            skey: '',
            passTicket: '',
            formateSyncKey: '',
            webwxDataTicket: '',
            deviceId: 'e' + Math.random().toString().substring(2, 17),

            baseRequest: {},
            syncKey: {}
        }

        self[API] = {
            jsLogin: 'https://login.weixin.qq.com/jslogin',
            login: 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login'
        }

        self.syncErrorCount = 0
        self.mediaSend = 0
        self.state = CONF.STATE.init

        self.user = [] // 登陆账号
        self.memberList = [] // 所有联系人

        self.contactList = [] // 个人联系人
        self.groupList = [] // 已保存群聊
        self.groupMemberList = [] // 所有群聊内联系人
        self.publicList = [] // 公众账号
        self.specialList = [] // 特殊账号

        self.request = new Request()
    }
    init_class.call(this);
}


util.inherits(Wechat, events.EventEmitter);

Wechat.prototype.setProp = function(key, val) {
    var self = this;
    self[PROP][key] = val
}

Wechat.prototype.getProp = function(key) {
    var self = this;
    return self[PROP][key]
}

// 通讯录好友
Wechat.prototype.getfriendList = function() {
    var self = this;
    var members = []
    self.groupList.forEach(function(member) {
        members.push({
            username: member['UserName'],
            nickname: '群聊: ' + member['NickName'],
            py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
            avatar: self[API].baseUri.match(/http.*?\/\/.*?(?=\/)/)[0] + member.HeadImgUrl
        })
    })

    self.contactList.forEach(function(member) {
        members.push({
            username: member['UserName'],
            nickname: member['RemarkName'] ? member['RemarkName'] : member['NickName'],
            py: member['RemarkPYQuanPin'] ? member['RemarkPYQuanPin'] : member['PYQuanPin'],
            avatar: self[API].baseUri.match(/http.*?\/\/.*?(?=\/)/)[0] + member.HeadImgUrl
        })
    })

    return members
}

Wechat.prototype.getUUID = function() {
    var self = this;
    var params = {
        'appid': 'wx782c26e4c19acffb',
        'fun': 'new',
        'lang': 'zh_CN'
    }
    return self.request.R({
        method: 'GET',
        url: self[API].jsLogin,
        params: params
    }).then(function(res) {
        var pm = res.data.match(/window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)"/)
        if (!pm) {
            throw new Error('UUID错误: 格式错误')
        }
        var code = +pm[1]
        var uuid = self[PROP].uuid = pm[2]

        if (code !== 200) {
            throw new Error('UUID错误: ' + code)
        }

        self.emit('uuid', uuid)
        self.state = CONF.STATE.uuid

        return uuid
    }).catch(function(err) {
        debug(err)
        throw new Error('获取UUID失败')
    })
}

Wechat.prototype.checkScan = function() {
    var self = this;
    debug('CheckScan')

    return self.request.R({
        method: 'GET',
        url: self[API].login + '?loginicon=true&tip=0&uuid=' + self[PROP].uuid,
        headers: {
            'Referer': 'https://wx.qq.com/'
        }
    }).then(function(res) {
        var pm = res.data.match(/window.code=(\d+);/)
        var code = +pm[1]

        if (code != 201 && code != 408 && code != 200) {
            throw new Error('扫描状态code错误: ' + code)
        }
        if (code == 408) { // timeout continue;
            debug('[408] timeout continue.')
            return self.checkScan.call(self);
        } else if (code == 201) {
            debug('scaned!')
            self.emit('scan');
            return self.checkScan.call(self);
        } else { //200
            pm = res.data.match(/window.redirect_uri="(\S+?)";/)
            self[API].rediUri = pm[1] + '&fun=new'
            self[API].baseUri = self[API].rediUri.substring(0, self[API].rediUri.lastIndexOf('/'))

            // 接口更新
            updateAPI(self[API])

            self.emit('confirm')
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('获取扫描状态信息失败')
    })
}

/*
Wechat.prototype.checkLogin = function() {
    var self = this;
    debug('checkLogin')
    return self.request.R({
        method: 'GET',
        url: self[API].login + '?loginicon=true&tip=0&uuid=' + self[PROP].uuid
    }).then(function(res) {
        console.log(res.data);
        var pm = res.data.match(/window.code=(\d+);/)
        var code = pm[1]

        if (code !== '200' && code !== 408) {
            throw new Error('登陆确认code错误: ' + code)
        }

        if (code == 408) { // timeout continue;
            debug('[408] timeout continue.')
            return self.checkLogin.call(self);
        }
        pm = res.data.match(/window.redirect_uri="(\S+?)";/)
        self[API].rediUri = pm[1] + '&fun=new'
        self[API].baseUri = self[API].rediUri.substring(0, self[API].rediUri.lastIndexOf('/'))

        // 接口更新
        updateAPI(self[API])

        self.emit('confirm', code)
    }).catch(function(err) {
        debug(err)
        throw new Error('获取确认登录信息失败')
    })
}
*/

Wechat.prototype.login = function() {
    var self = this;
    debug('login')
    return self.request.R({
        method: 'GET',
        url: self[API].rediUri
    }).then(function(res) {
        self[PROP].skey = res.data.match(/<skey>(.*)<\/skey>/)[1]
        self[PROP].sid = res.data.match(/<wxsid>(.*)<\/wxsid>/)[1]
        self[PROP].uin = res.data.match(/<wxuin>(.*)<\/wxuin>/)[1]
        self[PROP].passTicket = res.data.match(/<pass_ticket>(.*)<\/pass_ticket>/)[1]
        self[PROP].skey = querystring.unescape(self[PROP].skey);
        self[PROP].sid = querystring.unescape(self[PROP].sid);
        self[PROP].uin = querystring.unescape(self[PROP].uin);
        self[PROP].passTicket = querystring.unescape(self[PROP].passTicket);

        if (res.headers['set-cookie']) {
            res.headers['set-cookie'].forEach(function(item) {
                if (item.indexOf('webwxDataTicket') !== -1) {
                    self[PROP].webwxDataTicket = item.split('; ').shift().split('=').pop()
                }
            })
        }
        self[PROP].baseRequest = {
            'Uin': parseInt(self[PROP].uin, 10),
            'Sid': self[PROP].sid,
            'Skey': self[PROP].skey,
            'DeviceID': self[PROP].deviceId
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('登录失败')
    })
}

Wechat.prototype.init = function() {
    var self = this;
    debug('init')
    var params = {
        'pass_ticket': self[PROP].passTicket,   //'skey': self[PROP].skey,
        'lang': 'zh_CN',
        'r': +new Date()
    }
    var data = {
        BaseRequest: self[PROP].baseRequest
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxinit,
        params: params,
        data: data,
        type: 'json',
        headers: {
            'Referer': 'https://wx.qq.com/?&lang=zh_CN'
        }
    }).then(function(res) {
        var data = res.data
        self.user = data['User']

        self._updateSyncKey(data['SyncKey'])

        if (data['BaseResponse']['Ret'] !== 0) {
            throw new Error('微信初始化Ret错误' + data['BaseResponse']['Ret'])
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('微信初始化失败')
    })
}

Wechat.prototype.notifyMobile = function() {
    var self = this;
    debug('notifymobile')
    var data = {
        'BaseRequest': self[PROP].baseRequest,
        'Code': 3,
        'FromUserName': self.user['UserName'],
        'ToUserName': self.user['UserName'],
        'ClientMsgId': +new Date()
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxstatusnotify,
        data: data,
        type: 'json'
    }).then(function(res) {
        var data = res.data
        if (data['BaseResponse']['Ret'] !== 0) {
            throw new Error('开启状态通知Ret错误' + data['BaseResponse']['Ret'])
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('开启状态通知失败')
    })
}

Wechat.prototype.getContact = function() {
    var self = this;
    debug('getcontact')
    var params = {
        'lang': 'zh_CN',
        'pass_ticket': self[PROP].passTicket,
        'seq': 0,
        'skey': self[PROP].skey,
        'r': +new Date()
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxgetcontact,
        params: params
    }).then(function(res) {
        var data = res.data
        self.memberList = data['MemberList']

        if (self.memberList.length === 0) {
            throw new Error('通讯录获取异常')
        }

        self.state = CONF.STATE.login
        self.emit('login', self.memberList)

        for (var ii in self.memberList) {
            var member = self.memberList[ii];
            member['NickName'] = convertEmoji(member['NickName'])
            member['RemarkName'] = convertEmoji(member['RemarkName'])

            if (member['VerifyFlag'] & 8) {
                self.publicList.push(member)
            } else if (CONF.SPECIALUSERS.indexOf(member['UserName']) > -1) {
                self.specialList.push(member)
            } else if (member['UserName'].indexOf('@@') > -1) {
                self.groupList.push(member)
            } else {
                self.contactList.push(member)
            }
        }
        debug('好友数量：' + self.memberList.length)
        return self.memberList
    }).catch(function(err) {
        debug(err)
        throw new Error('获取通讯录失败')
    })
}

Wechat.prototype.batchGetContact = function() {
    var self = this;
    debug('batchgetcontact')
    var params = {
        'pass_ticket': self[PROP].passTicket,
        'type': 'e',
        'r': +new Date()
    }
    var data = {
        'BaseRequest': self[PROP].baseRequest,
        'Count': self.groupList.length,
        'List': self.groupList.map(function(member) {
            return {
                'UserName': member['UserName'],
                'EncryChatRoomId': ''
            }
        })
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxbatchgetcontact,
        params: params,
        data: data,
        type: 'json'
    }).then(function(res) {
        var data = res.data
        var contactList = data['ContactList']

        for (var ii in contactList) {
            var group = contactList[ii];
            for (var jj in group['MemberList']) {
                var member = group['MemberList'][jj];
                self.groupMemberList.push(member)
            }
        }
        debug('群组好友总数：', self.groupMemberList.length)
        return self.groupMemberList
    }).catch(function(err) {
        debug(err)
        throw new Error('获取群组通讯录失败')
    })
}

Wechat.prototype.syncPolling = function() {
    var self = this;
    debug('syncpolling')
    self._syncCheck().then(function(state) {
        if (state.retcode !== CONF.SYNCCHECK_RET_SUCCESS) {
            throw new Error('你登出了微信')
        } else {
            if (state.selector !== CONF.SYNCCHECK_SELECTOR_NORMAL) {
                return self._sync().then(function(data) {
                    setTimeout(function() {
                        self.syncPolling()
                    }, 1000)
                    self._handleMsg(data)
                })
            } else {
                debug('WebSync Normal')
                setTimeout(function() {
                    self.syncPolling()
                }, 1000)
            }
        }
    }).catch(function(err) {
        if (++self.syncErrorCount > 3) {
            debug(err)
            self.emit('error', err)
            self.logout()
        } else {
            setTimeout(function() {
                self.syncPolling()
            }, 1000)
        }
    })
}

Wechat.prototype.logout = function() {
    var self = this;
    debug('logout')
    var params = {
        redirect: 1,
        type: 0,
        skey: self[PROP].skey
    }

    // data加上会出错，不加data也能登出
    var data = {
        sid: self[PROP].sid,
        uin: self[PROP].uin
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxlogout,
        params: params,
        data: data,
        type: 'txt'
    }).then(function(res) {
        self.state = CONF.STATE.logout
        self.emit('logout')
        return '登出成功'
    }).catch(function(err) {
        debug(err)
        self.state = CONF.STATE.logout
        self.emit('logout')
        throw new Error('可能登出成功')
    })
}

Wechat.prototype.start = function() {
    var self = this;
    debug('start')
    return Promise.resolve(self.state === CONF.STATE.uuid ? 0 : self.getUUID())
        .then(function() {
            return self.checkScan();
        }) 
        .then(function() {
            return self.login();
        })
        .then(function() {
            return self.init();
        })
        .then(function() {
            return self.notifyMobile();
        })
        .then(function() {
            return self.getContact();
        })
        .then(function() {
            return self.batchGetContact();
        })
        .then(function() {
            if (self.state !== CONF.STATE.login) {
                throw new Error('登陆失败，未进入SyncPolling')
            }
            return self.syncPolling()
        }).catch(function(err) {
            debug('启动失败', err)
            self.stop()
            throw new Error('启动失败')
        })
}

Wechat.prototype.stop = function() {
    var self = this;
    debug('stop')
    return self.state === CONF.STATE.login ? self.logout() : Promise.resolve()
}

Wechat.prototype.sendMsg = function(msg, to) {
    var self = this;
    var params = {
        'pass_ticket': self[PROP].passTicket
    }
    var clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    var data = {
        'BaseRequest': self[PROP].baseRequest,
        'Msg': {
            'Type': 1,
            'Content': msg,
            'FromUserName': self.user['UserName'],
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
        }
    }
    self.request.R({
        method: 'POST',
        url: self[API].webwxsendmsg,
        params: params,
        data: data,
        type: 'json'
    }).then(function(res) {
        var data = res.data
        if (data['BaseResponse']['Ret'] !== 0) {
            throw new Error('发送信息Ret错误: ' + data['BaseResponse']['Ret'])
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('发送信息失败')
    })
}

Wechat.prototype.sendImage = function(to, file, type, size) {
    var self = this;
    return self._uploadMedia(file, type, size)
        .then(function(mediaId) {
            return self._sendImage(mediaId, to);
        })
        .catch(function(err) {
            debug(err)
            throw new Error('发送图片信息失败')
        })
}

Wechat.prototype._syncCheck = function() {
    var self = this;
    debug('_synccheck')
    var params = {
        'r': +new Date(),
        'sid': self[PROP].sid,
        'uin': self[PROP].uin,
        'skey': self[PROP].skey,
        'deviceid': self[PROP].deviceId,
        'synckey': self[PROP].formateSyncKey
    }
    return self.request.R({
        method: 'GET',
        url: self[API].synccheck,
        params: params
    }).then(function(res) {
        //console.log('_sync check:', res.data);
        var re = /window.synccheck={retcode:"(\d+)",selector:"(\d+)"}/
        var pm = res.data.match(re)

        var retcode = +pm[1]
        var selector = +pm[2]

        return {
            'retcode': retcode,
            'selector': selector
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('同步失败')
    })
}

Wechat.prototype._sync = function() {
    var self = this;
    debug('_sync')
    var params = {
        'sid': self[PROP].sid,
        'skey': self[PROP].skey,
        'pass_ticket': self[PROP].passTicket
    }
    var data = {
        'BaseRequest': self[PROP].baseRequest,
        'SyncKey': self[PROP].syncKey,
        'rr': ~new Date()
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxsync,
        params: params,
        data: data,
        type: 'json'
    }).then(function(res) {
        var data = res.data
        if (data['BaseResponse']['Ret'] !== 0) {
            throw new Error('拉取消息Ret错误: ' + data['BaseResponse']['Ret'])
        }

        self._updateSyncKey(data['SyncKey'])
        return data
    }).catch(function(err) {
        debug(err)
        throw new Error('获取新信息失败')
    })
}

Wechat.prototype._handleMsg = function(data) {
    var self = this;
    debug('handlemsg')
    debug('Receive ', data['AddMsgList'].length, 'Message')

    data['AddMsgList'].forEach(function(msg) {
        var type = +msg['MsgType']
        var fromUser = self._getUserRemarkName(msg['FromUserName'])
        var content = contentPrase(msg['Content'])

        switch (type) {
            case CONF.MSGTYPE_STATUSNOTIFY:
                debug(' Message: Init')
                self.emit('init-message')
                break
            case CONF.MSGTYPE_TEXT:
                debug(' Text-Message: ', fromUser, ': ', content)
                self.emit('text-message', msg)
                break
            case CONF.MSGTYPE_IMAGE:
                debug(' Image-Message: ', fromUser, ': ', content)
                self._getMsgImg(msg.MsgId).then(function(image) {
                    msg.Content = image
                    self.emit('image-message', msg)
                })
                break
            case CONF.MSGTYPE_VOICE:
                debug(' Voice-Message: ', fromUser, ': ', content)
                self._getVoice(msg.MsgId).then(function(voice) {
                    msg.Content = voice
                    self.emit('voice-message', msg)
                })
                break
            case CONF.MSGTYPE_EMOTICON:
                debug(' Emoticon-Message: ', fromUser, ': ', content)
                self._getEmoticon(content).then(function(emoticon) {
                    msg.Content = emoticon
                    self.emit('emoticon-message', msg)
                })
                break
            case CONF.MSGTYPE_VERIFYMSG:
                debug(' Message: Add Friend')
                self.emit('verify-message', msg)
                break
        }
    })
}


Wechat.prototype._uploadMedia = function(fullfilename) {
    var self = this;
    debug('uploadmedia')
    var type = mime.lookup(fullfilename);
    var size = fs.statSync(fullfilename).size;
    var filename = path.basename(fullfilename);

    var mediaId = self.mediaSend++
        var clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)

    var uploadMediaRequest = JSON.stringify({
        BaseRequest: self[PROP].baseRequest,
        ClientMediaId: clientMsgId,
        TotalLen: size,
        StartPos: 0,
        DataLen: size,
        MediaType: 4
    })



    var form = [];
    form.push({
        name: 'id',
        value: 'WU_FILE_' + mediaId
    });
    form.push({
        name: 'name',
        value: filename
    });
    form.push({
        name: 'type',
        value: type
    });
    form.push({
        name: 'lastModifieDate',
        value: new Date().toGMTString()
    });
    form.push({
        name: 'size',
        value: size
    });
    form.push({
        name: 'mediatype',
        value: 'pic'
    }); //'doc'
    form.push({
        name: 'uploadmediarequest',
        value: uploadMediaRequest
    });
    form.push({
        name: 'webwx_data_ticket',
        value: self[PROP].webwxDataTicket
    });
    form.push({
        name: 'pass_ticket',
        value: encodeURI(self[PROP].passTicket)
    });
    form.push({
        name: 'filename',
        filename: fullfilename
    });

    var params = {
        f: 'json'
    }

    return self.request.R({
        url: self[API].webwxuploadmedia,
        method: 'MULTI',
        params: params,
        data: form
    }).then(function(res) {
        var mediaId = res.data.MediaId
        if (!mediaId) {
            throw new Error('MediaId获取失败')
        }
        return mediaId
    }).catch(function(err) {
        debug(err)
        throw new Error('上传图片失败')
    })
}

Wechat.prototype._sendImage = function(mediaId, to) {
    var self = this;
    debug('_sendImage')
    var params = {
        'pass_ticket': self[PROP].passTicket,
        'fun': 'async',
        'f': 'json'
    }
    var clientMsgId = +new Date() + '0' + Math.random().toString().substring(2, 5)
    var data = {
        'BaseRequest': self[PROP].baseRequest,
        'Msg': {
            'Type': 3,
            'MediaId': mediaId,
            'FromUserName': self.user['UserName'],
            'ToUserName': to,
            'LocalID': clientMsgId,
            'ClientMsgId': clientMsgId
        }
    }
    return self.request.R({
        method: 'POST',
        url: self[API].webwxsendmsgimg,
        params: params,
        data: data,
        type: 'json'
    }).then(function(res) {
        var data = res.data
        if (data['BaseResponse']['Ret'] !== 0) {
            throw new Error('发送图片信息Ret错误: ' + data['BaseResponse']['Ret'])
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('发送图片失败')
    })
}

Wechat.prototype._getMsgImg = function(msgId) {
    var self = this;
    debug('_getMsgImg')
    var params = {
        MsgID: msgId,
        skey: self[PROP].skey
    }

    return self.request.R({
        method: 'GET',
        url: self[API].webwxgetmsgimg,
        params: params,
        responseType: 'arraybuffer'
    }).then(function(res) {
        return {
            data: res.raw,
            type: res.headers['content-type']
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('获取图片失败')
    })
}

Wechat.prototype._getVoice = function(msgId) {
    var self = this;
    debug('_getvoice')
    var params = {
        MsgID: msgId,
        skey: self[PROP].skey
    }

    return self.request.R({
        method: 'GET',
        url: self[API].webwxgetvoice,
        params: params,
        responseType: 'arraybuffer'
    }).then(function(res) {
        return {
            data: res.raw,
            type: res.headers['content-type']
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('获取声音失败')
    })
}

Wechat.prototype._getEmoticon = function(content) {
    var self = this;
    debug('getEmoticon')
    var configurl = content.match(/cdnurl="(.*?)"/)[1];
    return Promise.resolve().then(function() {
        return self.request.R({
            method: 'GET',
            url: configurl,
            responseType: 'arraybuffer'
        })
    }).then(function(res) {
        return {
            data: res.raw,
            type: res.headers['content-type'],
            url: configurl
        }
    }).catch(function(err) {
        debug(err)
        throw new Error('获取表情失败')
    })
}

Wechat.prototype._getHeadImg = function(member) {
    var self = this;
    debug('getHeadImg')
    var url = self[API].baseUri.match(/http.*?\/\/.*?(?=\/)/)[0] + member.HeadImgUrl
    return self.request.R({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
    }).then(function(res) {
        var headImg = {
            data: res.raw,
            type: res.headers['content-type']
        }
        member.HeadImg = headImg
        return headImg
    }).catch(function(err) {
        debug(err)
        throw new Error('获取头像失败')
    })
}

Wechat.prototype._getUserRemarkName = function(uid) {
    var self = this;
    debug('_getUserRemarkName:' + uid)
    for (var ii in self.memberList) {
        var member = self.memberList[ii];
        //console.log("FIND UID:", member['UserName'])
        if (member['UserName'] === uid) {
            return member['RemarkName'] ? member['RemarkName'] : member['NickName']
        }
    }
    debug('不存在用户', uid)
    return uid
}

Wechat.prototype._updateSyncKey = function(syncKey) {
    var self = this;
    debug('_updateSyncKey')
    self[PROP].syncKey = syncKey
    var synckeylist = []
    for (var e = self[PROP].syncKey['List'], o = 0, n = e.length; n > o; o++) {
        synckeylist.push(e[o]['Key'] + '_' + e[o]['Val'])
    }
    self[PROP].formateSyncKey = synckeylist.join('|')
}



Wechat.STATE = CONF.STATE
exports = module.exports = Wechat