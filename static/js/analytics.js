var lat=null;
var lng=null;
var province=null;
var city=null;

var acctuserUrl="https://www.szwen.cn/zwinfoAcctuser";

//用户进入页面时间
var tltimeins=Date.parse(new Date());

var second = 0;
var uuid = null;
var CookieUtil=null;
var tracker=null;
(function(){
	
	window.setInterval(function () {
	    second ++;
	}, 1000);
	
	
	//获取当前城市
    var geolocation=new BMap.Geolocation();
    geolocation.getCurrentPosition(function(r){
        if(this.getStatus()==BMAP_STATUS_SUCCESS){
            lat=r.latitude;//当前纬度
            lng=r.longitude;//当前经度
            province=r.address.province; //返回当前省份
            city=r.address.city;//返回当前城市
            //console.log("lat:"+lat+"**lng:"+lng+"**province:"+province+"**city:"+city)
        	//加载用户采集信息
        	autoLoad();
        }else{
        	//加载用户采集信息
        	autoLoad();
        }
    })
	
	CookieUtil = {
			// get the cookie of the key is name
			get: function(name) {
				var cookieName = encodeURIComponent(name) + "=",
					cookieStart = document.cookie.indexOf(cookieName),
					cookieValue = null;
				if (cookieStart > -1) {
					var cookieEnd = document.cookie.indexOf(";", cookieStart);
					if (cookieEnd == -1) {
						cookieEnd = document.cookie.length;
					}
					cookieValue = decodeURIComponent(document.cookie.substring(cookieStart+cookieName.length, cookieEnd));
				}
				return cookieValue;
			},
			// set the name/value pair to browser cookie
			set: function(name, value, expires, path, domain, secure) {
				var cookieText = encodeURIComponent(name) + "=" + encodeURIComponent(value);

				if (expires) {
					// set the expires time
					var expiresTime = new Date();
					expiresTime.setTime(expires);
					cookieText += ";expires=" +  expiresTime.toGMTString();
				}

				if (path) {
					cookieText += ";path=" + path;
				}

				if (domain) {
					cookieText += ";domain=" + domain;
				}

				if (secure) {
					cookieText += ";secure";
				}

				document.cookie = cookieText;
			},
			setExt: function(name, value) {
				this.set(name, value, new Date().getTime() + 315360000000, "/");
			}
	};
	

	// 主体，其实就是tracker js
	tracker = {
			// config
			clientConfig: {
				serverUrl: acctuserUrl+"/collectUserData/addRecord2",
				sessionTimeout: 360, // 360s -> 6min
				maxWaitTime: 3600, // 3600s -> 60min -> 1h
				ver: "1"
			},

			cookieExpiresTime: 315360000000, // cookie过期时间，10年
			
			dataColumns: {
                // 发送到服务器的列名称
                eventName: "eventName", //事件名称
                version: "version", //版本号
                platform: "platform", //CollectUserData.java
                sdk: "sdk", //sdk
                id: "id",	//id
                uuid: "uuid",	//用户ID
                memberId: "memberId",	//会员ID
                sessionId: "sessionId",	//会话id
                clientTime: "clientTime",	//客户端时间
                language: "language",	//浏览器语言
                resolution: "resolution",	//浏览器分辨率
                currentUrl: "currentUrl",	//当前浏览的网页url
                referrerUrl: "referrerUrl",	//当前浏览的网页的前一个网页的url
                title: "title", //（网页标题）当前地址对应的模块名称
                lat: "lat", //经度
                lng: "lng", //纬度
                province: "province", //国家
                city: "city", //城市
                hostname:"hostname", //域名
                dataCode:"dataCode", //数据标志
                appid:"appid", //appid
                timestamp:"timestamp", //时间戳
			},

			keys: {
				//eventName-值
				pageView: "e_pv",
				chargeRequestEvent: "e_crt",
				launch: "e_l",
				eventDurationEvent: "e_e",
				sid: "bftrack_sid",
				uuid: "bftrack_uuid",
				mid: "bftrack_mid",
				preVisitTime: "bftrack_previsit",
			},

			/**
			 * 获取会话id
			 */
			getSid: function() {
				return CookieUtil.get(this.keys.sid);
			},

			/**
			 * 保存会话id到cookie
			 */
			setSid: function(sid) {
				if (sid) {
					CookieUtil.setExt(this.keys.sid, sid);
				}
			},

			/**
			 * 获取uuid，从cookie中
			 */
			getUuid: function() {
				return CookieUtil.get(this.keys.uuid);
			},

			/**
			 * 保存uuid到cookie
			 */
			setUuid: function(uuid) {
				if (uuid) {
					CookieUtil.setExt(this.keys.uuid, uuid);
				}
			},

			/**
			 * 获取memberID
			 */
			getMemberId: function() {
				return CookieUtil.get(this.keys.mid);
			},

			/**
			 * 设置mid
			 */
			setMemberId: function(mid) {
				if (mid) {
					CookieUtil.setExt(this.keys.mid, mid);
				}
			},

			startSession: function() {
				// 加载js就触发的方法
				if (this.getSid()) {
					// 会话id存在，表示uuid也存在
					if (this.isSessionTimeout()) {
						// 会话过期,产生新的会话
						this.createNewSession();
					} else {
						// 会话没有过期，更新最近访问时间
						this.updatePreVisitTime(new Date().getTime());
					}
				} else {
					// 会话id不存在，表示uuid也不存在
					this.createNewSession();
				}
				this.onPageView();
			},

			onLaunch: function() {
				// 触发launch事件
				var launch = {};
				launch[this.dataColumns.eventName] = this.keys.launch; // 设置事件名称
				this.setCommonColumns(launch); // 设置公用dataColumns
				this.sendDataToServer(launch);
				//this.sendDataToServer(this.parseParam(launch)); // 最终发送编码后的数据
			},

			onPageView: function() {
				// 触发page view事件
				if (this.preCallApi()) {
					var time = new Date().getTime();
					var pageviewEvent = {};
					pageviewEvent[this.dataColumns.eventName] = this.keys.pageView; // 设置事件名称
					pageviewEvent[this.dataColumns.currentUrl] = window.location.href; // 设置当前url
					pageviewEvent[this.dataColumns.referrerUrl] = document.referrer; // 设置前一个页面的url
					pageviewEvent[this.dataColumns.title] = document.title; // 设置title
					//console.log("lat:"+lat+"**lng:"+lng+"**province:"+province+"**city:"+city)
					pageviewEvent[this.dataColumns.lat] = lat;
		        	pageviewEvent[this.dataColumns.lng] = lng;
		        	pageviewEvent[this.dataColumns.province] = province;
		        	pageviewEvent[this.dataColumns.city] = city;
		        	pageviewEvent[this.dataColumns.appid] = 'acctuser';
		        	pageviewEvent[this.dataColumns.timestamp] = new Date().getTime();
		        	this.setCommonColumns(pageviewEvent); // 设置公用dataColumns
					//this.sendDataToServer(this.parseParam(pageviewEvent)); // 最终发送编码后的数据ss
					this.sendDataToServer(pageviewEvent); // 最终发送编码后的数据ss
					this.updatePreVisitTime(time);
				}
			},

			/**
			 * 执行对外方法前必须执行的方法
			 */
			preCallApi: function() {
				if (this.isSessionTimeout()) {
					// 如果为true，表示需要新建
					this.startSession();
				} else {
					this.updatePreVisitTime(new Date().getTime());
				}
				return true;
			},

			sendDataToServer: function(data) {
				// 发送数据data到服务器，其中data是一个字符串
				/*var that = this;
				var i2 = new Image(1,1);
				i2.onerror = function(){
					// 这里可以进行重试操作
				};
				i2.src = this.clientConfig.serverUrl + "?" + data;*/
				
				
				var tokens=creatheaderkey(data);
		        $.ajax({
		            headers:{
		                "token":tokens
		            },
		            type: "POST",
		            contentType: "application/x-www-form-urlencoded",
		            timeout: 0,
		            url: this.clientConfig.serverUrl,
		            data: data,
		            dataType: "JSON",
		            success: function (result) {
		    			if(result.code==0){
		    				var data = result.data;
		    				//console.log(data);
		    				if(data!=undefined && data!=''){
		    					
		    				}else{
		    					
		    				}
		    			}else{
		    				console.warn("数据请求错误! error："+result.msg);
		    			}
		    		},
		    		error: function () {
		    			//alert("数据请求信息异常");
		    			console.warn("数据请求信息异常");
		    		}
		    	});
				
			},

			/**
			 * 往data中添加发送到日志收集服务器的公用部分
			 */
			setCommonColumns: function(data) {
				data[this.dataColumns.version] = this.clientConfig.ver;
				data[this.dataColumns.platform] = "website";
				data[this.dataColumns.sdk] = "js";
				data[this.dataColumns.dataCode] = "1";
				data[this.dataColumns.appid] = "acctuser";
				data[this.dataColumns.timestamp] = new Date().getTime();
				data[this.dataColumns.id] = this.generateId(); // 设置用户id
				data[this.dataColumns.uuid] = this.getUuid(); // 设置用户id
				//data[this.dataColumns.memberId] = this.getMemberId(); // 设置会员id
				data[this.dataColumns.sessionId] = this.getSid(); // 设置sid
				data[this.dataColumns.clientTime] = getNowTime(); // 设置客户端时间
				data[this.dataColumns.language] = window.navigator.language; // 设置浏览器语言
				data[this.dataColumns.hostname] = window.location.hostname; // 设置访问域名
				data[this.dataColumns.resolution] = screen.width + "*" + screen.height; // 设置浏览器分辨率
			},

			/**
			 * 创建新的会员，并判断是否是第一次访问页面，如果是，进行launch事件的发送。
			 */
			createNewSession: function() {
				var time = new Date().getTime(); // 获取当前操作时间
				// 1. 进行会话更新操作
				var sid = this.generateId(); // 产生一个session id
				this.setSid(sid);
				this.updatePreVisitTime(time); // 更新最近访问时间
				// 2. 进行uuid查看操作
				if (!this.getUuid()) {
					// uuid不存在，先创建uuid，然后保存到cookie，最后触发launch事件
					var uuid = this.generateId(); // 产品uuid
					this.setUuid(uuid);
					this.onLaunch();
				}
			},

			/**
			 * 参数编码返回字符串
			 */
			parseParam: function(data) {
				var params = "";
				for (var e in data) {
					if (e && data[e]) {
						params += encodeURIComponent(e) + "=" + encodeURIComponent(data[e]) + "&";
					}
				}
				if (params) {
					return params.substring(0, params.length - 1);
				} else {
					return params;
				}
			},

			/**
			 * 产生uuid
			 */
			generateId: function() {
				var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
				var tmpid = [];
				var r;
				tmpid[8] = tmpid[13] = tmpid[18] = tmpid[23] = '-';
				tmpid[14] = '4';

				for (i=0; i<36; i++) {
					if (!tmpid[i]) {
						r = 0| Math.random()*16;
						tmpid[i] = chars[(i==19) ? (r & 0x3) | 0x8 : r];
					}
				}
				return tmpid.join('');
			},

			/**
			 * 判断这个会话是否过期，查看当前时间和最近访问时间间隔时间是否小于this.clientConfig.sessionTimeout<br/>
			 * 如果是小于，返回false;否则返回true。
			 */
			isSessionTimeout: function() {
				var time = new Date().getTime();
				var preTime = CookieUtil.get(this.keys.preVisitTime);
				if (preTime) {
					// 最近访问时间存在,那么进行区间判断
					return time - preTime > this.clientConfig.sessionTimeout * 1000;
				}
				return true;
			},

			/**
			 * 更新最近访问时间
			 */
			updatePreVisitTime: function(time) {
				CookieUtil.setExt(this.keys.preVisitTime, time);
			},

			/**
			 * 打印日志
			 */
			log: function(msg) {
				console.log(msg);
			},
			
	};

	// 对外暴露的方法名称
	window.__AE__ = {
		startSession: function() {
			tracker.startSession();
		},
		onPageView: function() {
			tracker.onPageView();
		},
		setMemberId: function(mid) {
			tracker.setMemberId(mid);
		}
	};

	// 自动加载方法
	var autoLoad = function() {
		// 进行参数设置
		var _aelog_ = _aelog_ || window._aelog_ || [];
		var memberId = null;
		for (i=0;i<_aelog_.length;i++) {
			_aelog_[i][0] === "memberId" && (memberId = _aelog_[i][1]);
		}
		// 根据是给定memberid，设置memberid的值
		memberId && __AE__.setMemberId(memberId);
		// 启动session
		__AE__.startSession();
	};

})();


function tltimeCheck(){
	var tltimein = timestampToTime(tltimeins);
	var tltimeins2 = tltimeins + (second * 1000);
	var tltimeout = timestampToTime(tltimeins2);
	var data={
		'uuid':	CookieUtil.get(tracker.keys.uuid),
		'currentUrl' : location.href,
	    'referrerUrl' : document.referrer,
	    'tltime' : second,
	    'datatype' : document.title,
	    'tltimein' : tltimein,
	    'tltimeout' : tltimeout,
	    'appid' : 'acctuser',
	    'timestamp': new Date().getTime(),
	    'dataCode' : "1",
	}
	var tokens=creatheaderkey(data);
	$.ajax({
	    headers:{
	        "token":tokens
	    },
	    type: "POST",
	    contentType: "application/x-www-form-urlencoded",
	    timeout: 0,
	    url: acctuserUrl+"/collectUserTLTime/addRecord2",
	    data: data,
	    dataType: "JSON",
	    success: function (result) {
			if(result.state==0){
				var data = result.data;
				//console.log(data);
				if(data!=undefined && data!=''){
					
				}else{
					
				}
			}else{
				console.warn("数据请求错误! error："+result.msg);
			}
		},
		error: function () {
			//alert("数据请求信息异常");
			console.warn("数据请求信息异常");
		}
	});
}

function timestampToTime(timestamp) {
	var now = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
	var year=now.getFullYear(); 
	var month=now.getMonth()+1; 
	var day=now.getDate(); 
	var hour=now.getHours(); 
	var minute=now.getMinutes(); 
	var second=now.getSeconds(); 
	var nowdate=year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second; 
	return nowdate;
}

function getNowTime(){ 
	//取得当前时间 
	var now= new Date(); 
	var year=now.getFullYear(); 
	var month=now.getMonth()+1; 
	var day=now.getDate(); 
	var hour=now.getHours(); 
	var minute=now.getMinutes(); 
	var second=now.getSeconds(); 
	var nowdate=year+"-"+month+"-"+day+" "+hour+":"+minute+":"+second; 
	return nowdate;
}


window.onbeforeunload = function() {
	tltimeCheck();
};
