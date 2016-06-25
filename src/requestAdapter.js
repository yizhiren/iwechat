var Promise = require('promise');
var Request = require('poorequest');

var RequestAdapter = function(){
	var requestbot = new Request();
	var postPromise = function(dstUrl,option){
		return new Promise(function(resolve,reject){
			requestbot.post(dstUrl,option,function(err,res){
				if(err){
					reject(err);
				}else{
					try{
						res.data = res.raw.toString();
						res.data = JSON.parse(res.data);
					}catch(e){}
					resolve(res);
				}
			})
			
		});
	}
	var getPromise = function(dstUrl,option){
		return new Promise(function(resolve,reject){
			requestbot.get(dstUrl,option,function(err,res){
				if(err){
					reject(err);
				}else{
					try{
						res.data = res.raw.toString();
						res.data = JSON.parse(res.data);
					}catch(e){}
					resolve(res);
				}
			})
			
		});
	}
	var multiPromise = function(dstUrl,option){
		return new Promise(function(resolve,reject){
			requestbot.multi(dstUrl,option,function(err,res){
				if(err){
					reject(err);
				}else{
					try{
						res.data = res.raw.toString();
						res.data = JSON.parse(res.data);
					}catch(e){}
					resolve(res);
				}
			})
			
		});
	}
	this.R = function(option){
		if(option.method === 'POST'){
			return postPromise(option.url,{form:option.data,
										type:option.type,
										params:option.params,
										headers:option.headers});
		}else if(option.method === 'GET'){
			return getPromise(option.url,{params:option.params,
											headers:option.headers});
		}else if(option.method === 'MULTI'){
			return multiPromise(option.url,{params:option.params,
											fields:option.data,
											headers:option.headers});
		}else{
			console.log('ERR!!!');
		}

	}
}

module.exports=RequestAdapter
