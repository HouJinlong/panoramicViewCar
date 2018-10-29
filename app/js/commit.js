/**
 * 公共方法
 */
//屏蔽右键
document.oncontextmenu = function(){
    event.returnValue = false;
};
//获取所需 
var option =  getNeed();
var btn_scale = option.btn_scale,
hot_scale = option.hot_scale,
clickEvent = option.clickEvent;
/**
 * 获取所需
 * return {
 *   clickEvent 事件  touchend|click
 *   isMobile 是否手机   boolean
 *   isApple  是否是苹果 boolean
 *   btn_scale 热点点击区域的缩放程度 (由屏幕宽度算出来) number
 *   hot_scale 热点的缩放程度(由屏幕宽度算出来) number
 *   isWeiXin 是否是微信环境 boolean
 * }
 */

function getNeed() {
    var S = "ontouchend" in document ? "touchend" : "click"
        , P = {
            versions: function() {
                var t = navigator.userAgent;
                navigator.appVersion;
                return {
                    trident: t.indexOf("Trident") > -1,
                    presto: t.indexOf("Presto") > -1,
                    webKit: t.indexOf("AppleWebKit") > -1,
                    gecko: t.indexOf("Gecko") > -1 && -1 == t.indexOf("KHTML"),
                    mobile: !!t.match(/AppleWebKit.*Mobile.*/),
                    ios: !!t.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
                    android: t.indexOf("Android") > -1 || t.indexOf("Linux") > -1,
                    iPhone: t.indexOf("iPhone") > -1,
                    iPad: t.indexOf("iPad") > -1,
                    webApp: -1 == t.indexOf("Safari"),
                    WeiXin: t.match(/MicroMessenger/i) == 'micromessenger'
                }
            }(),
            language: (navigator.browserLanguage || navigator.language).toLowerCase()
        }
        , k = P.versions.mobile || P.versions.ios || P.versions.android || P.versions.iPhone || P.versions.iPad
        , M = P.versions.ios || P.versions.iPhone || P.versions.iPad;

    return {
        clickEvent: S,
        isMobile: k,
        isApple: M,
        btn_scale: function() {
            return console.log(window.innerWidth),
                k ? .5 : window.innerWidth >= 1536 ? .8 : window.innerWidth < 1536 && window.innerWidth > 960 ? .7 : .5
        }(),
        hot_scale: function() {
            var t = window.innerWidth / 1280;
            return t > 1 ? 1 : t < .6 ? .6 : t;
        }(),
        isWeiXin: function() {
            //window.navigator.userAgent属性包含了浏览器类型、版本、操作系统类型、浏览器引擎类型等信息，这个属性可以用来判断浏览器类型
            var ua = window.navigator.userAgent.toLowerCase();
            //通过正则表达式匹配ua中是否含有MicroMessenger字符串
            if (ua.match(/MicroMessenger/i) == 'micromessenger') {
                return true;
            } else {
                return false;
            }
        }()
    };
}


//热点对象
var hot = function(){
    var obj = {
         /**
          * 加载热点
          * @hotsPotList  热点数组
          */
        load:function(hotsPotList,edit){
            var hotsHtml = '';
            hotsPotList.forEach(function(hotsData,frame){
                if(hotsData){
                    if(hotsData.length==0)return;
                    hotsData.forEach(function(hotData){
                        hotsHtml+=hot.getHotStr(frame,hotData,edit);
                    })	
                }
            });
            $('.spritespin-stage').html(hotsHtml);
        },
        /**
         * 获取热点html
         * @frame 所在帧 
         * hotData 热点信息
         */
        getHotStr:function(frame,hotData,edit){
            var transform = 'scale('+hot_scale+') rotateY(0deg)';
            return '<div class="anim '+frame+'" data-id="'+hotData.Id+'"  style="left:'+hotData.L+';top:'+hotData.T+';transform:'+transform+';">'+(edit?'<textarea style="display:none;">'+JSON.stringify(hotData)+'</textarea>':'')+'</div>'
        },
        //根据 热点的位置 return Transform 值
        getTransform:function(t, e, n, i){
            var P = t > e && n < i ? 1 : t <= e && n < i ? 2 : t <= e && n >= i ? 3 : t > e && n >= i ? 4 : void 0;
            switch (P) {
                case 1:
                    return "rotateY(180deg) rotateX(180deg) translateZ(10px)";
                case 2:
                    return "rotateX(180deg) translateZ(10px)";
                case 3:
                    return "translateZ(10px)";
                case 4:
                    return "rotateY(180deg) translateZ(10px)"
            }
        },
        //热点展示
        hotShow:function(){
            //先移除
            var infoData = jsonData.hotsType[$(this).attr('data-id')];
            if($('.anim').children().length>0||("video" != infoData.fancybox[0].type)) {
               if($(this).children().length>0||("video" != infoData.fancybox[0].type)){
                $.fancybox.open((option.isMobile?hot.isMobileFancybox(infoData.fancybox):infoData.fancybox), {
                    parentEl: "#bg-div",
                    loop : false
                });
               }
                return;
            };
            var transform = hot.getTransform(this.offsetLeft,(.8 * window.innerWidth - this.offsetLeft),this.offsetTop,(.5 * window.innerWidth - this.offsetTop));
            $(this).css('transform',"scale("+hot_scale+") "+transform) ;
            $(this).append(hot.getShowHtml(infoData,transform)).css('z-index','990');
            setTimeout(function() {
                $(document).on(clickEvent, hot.removeHost)
            }, 0);
        },
        getShowHtml:function(infoData,transform){
            var u = "video" === infoData.fancybox[0].type ? "<div class='img1'></div>" : "";
            var infoHtml = [];
            infoHtml.push('<div class="line"></div>');	
            infoHtml.push("<div class='info default' style='transform: "+transform+";'>")
            infoHtml.push("<div class='text'><div class='content'>" + infoData.Title + "</div></div><div class='img' style='background-image:url(" + infoData.Preview + ");'></div>"+u);
            infoHtml.push("</div>");
            return infoHtml.join('');
        },
        //删除热点
        removeHost:function(){
            $(document).off(clickEvent, hot.removeHost),
            $(".anim").css('z-index','900'),
            $(".anim .line,.anim .info").remove();
        },
        /*
         * 移动端调整 fancybox 参数（处理横屏bug）
         * return 新的option
         */
        isMobileFancybox:function(option){
           return option.map(function(item){
                if(item.type=='image'){
                    item.src ='<div id="hotImg" ><img src="'+item.src+'"></div>';
                    item.type='inline';
                }
                return item;
            });
        }
    }
    return obj;
}()
