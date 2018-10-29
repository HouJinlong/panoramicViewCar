
var krpanoplugin = function (krpano) {
    var self = this;
    this.krpano = null;
    this.scenes = [];

    //delayedcall IDs
    this.delayedCallIds = {};
    //属性事件数组
    this.attributesEvents = {};
    //属性事件支持数组
    this.attributesEventSupport = "onover|onover|onhover|onout|onclick|ondown|onup|onloaded".split("|");

    //支持的事件名称数组
    this.eventSupport = "enterfullscreen|exitfullscreen|xmlcomplete|previewcomplete|loadcomplete|newpano|removepano|newscene|loaderror|keydown|keyup|click|dbclick|mousedown|mouseup|mousewheel|idle|viewchange|viewchanged|resize|show_controller_bar|hide_controller_bar|enter_vr|exit_vr|open_hotspot|close_hotspot|video_ready".split("|");
    this.events = {};
    for (var index = 0; index < this.eventSupport.length; index++) {
        this.events[this.eventSupport[index]] = [];
    }
    if (krpano) {
        this.registerplugin(krpano);
    }
}; 

krpanoplugin.prototype = {
    /**
     * 注册插件
     * @param  object krpanointerface 播放器的DOM对象
     * @param  string pluginpath
     * @param  object pluginobject
     * @return this
     */
    registerplugin: function (krpanointerface, pluginpath, pluginobject) {
        this.krpano = krpanointerface;
        var self = this;
        // 绑定events事件回调到js的公共入口方法
        window.krpanoEventFunction = function (eventName) {
            if (typeof self.events[eventName] != 'undefined') {
                for (var i = 0; i < self.events[eventName].length; i++) {
                    typeof self.events[eventName][i] != 'function' || self.events[eventName][i].call(self);
                }
            }
        };
        //layer、plugin、hotspot等属性事件绑定js的公共回调方法
        window.krpanoAttrEventFunction = function (name, attr) {
            if (typeof self.attributesEvents[name] != 'undefined' && typeof self.attributesEvents[name][attr] == 'function') {
                if (self.get('device.flash')) {
                    self.delayedcall(0.1, function () {
                        self.attributesEvents[name][attr].call(self);
                    });
                } else {
                    self.attributesEvents[name][attr].call(self);
                }
            }
        };
        return this;
    },
    /**
     *
     * @return void
     */
    unloadplugin: function () {
        this.krpano = null;
    },
    /**
     * 添加layer层
     * @param  string name       layer的name属性
     * @param  json   attributes layer各个属性
     * @return string  			 返回layer对象
     */
    addlayer: function (name, attributes) {
        var layer = "layer[" + name + "]";
        this.krpano.call("addlayer(" + name + ")");
        if (attributes) {
            this.setattributes(layer, attributes);
        }
        return layer;
    },
    /**
     * 删除layer
     * @param  string name layer的name属性
     * @return this
     */
    removelayer: function (name) {
        this.krpano.call("removelayer(" + name + ")");
        return this;
    },

    /**
     * 添加插件
     * @param  string name       插件名称
     * @param  json   attributes 插件属性
     * @return string 返回plugin对象
     */
    addplugin: function (name, attributes) {
        var plugin = "plugin[" + name + "]";
        this.krpano.call("addplugin(" + name + ")");
        if (attributes) {
            this.setattributes(plugin, attributes);
        }
        return plugin;
    },

    /**
     * 删除plugin
     * @return this
     */
    removeplugin: function (name) {
        this.krpano.call("removeplugin(" + name + ")");
        return this;
    },

    /**
     * 添加热点hotspot
     * @param  string name       hotspot的name属性
     * @param  json   attributes 设置hotspot的相关属性
     * @return string            返回hotspot对象
     */
    addhotspot: function (name, attributes) {
        var hotspot = "hotspot[" + name + "]";
        this.krpano.call("addhotspot(" + name + ")");
        if (attributes) {
            this.setattributes(hotspot, attributes);
        }
        return hotspot;
    },

    /**
     * 删除hotspot
     * @return {[type]} [description]
     */
    removehotspot: function (name) {
        this.krpano.call("removehotspot(" + name + ")");
        return this;
    },
    /**
     * 设置krpano对象的属性（也可以用来添加对象）
     * @param  string object     krpano对象名称
     * @param  json   attributes 需要设置属性
     * @return this
     */
    setattributes: function (object, attributes) {
        for (var i in attributes) {
            //判断是否属于属性事件触发JS方法
            if (typeof attributes[i] == 'function' && this.inArray(i, this.attributesEventSupport)) {
                typeof this.attributesEvents[object] != "undefined" ? null : this.attributesEvents[object] = {};
                this.attributesEvents[object][i] = attributes[i];
                this.set(object + "." + i, "js(krpanoAttrEventFunction(" + object + ", " + i + "))");
            } else {
                this.set(object + "." + i, attributes[i]);
            }
        }
        return this;
    },
    /**
     * 删除场景
     * @param  string name 场景名称
     * @return this
     */
    removescene: function (name) {
        this.krpano.call("loadscene(" + name + ", null, REMOVESCENES)");
        return this;
    },
    /**
     * 加载场景
     * @param  string name 场景名称
     * @return this
     */
    loadscene: function (name) {
        this.krpano.call("myloadscene(" + name + ")");
        return this;
    },
    /**
     * 构建全景场景配置
     * @param  json scene 全景数据
     * @return string 场景的配置字符串
     */
    panoscenexml: function (scene) {
        return panoscenexmlTpl(scene);
    },

    /**
     * 构建视频场景配置
     * @param  json scene 全景数据
     * @return string 场景的配置字符串
     */
    videoscenexml: function (scene) {
        return videoscenexmlTpl(scene);
    },
    /**
     * 创建场景
     * @param  json scene 全景数据
     * @return string     场景名
     */
    createscene: function (scene) {
        var xml = "";
        var scene_name = "scene_" + scene.id;
        if (scene.isvideo != "true") {
            xml = this.panoscenexml(scene);
        } else {
            xml = this.videoscenexml(scene);
        }
        this.scenes.push(scene);
        this.loadxml(xml);
        return scene_name;
    },

    /**
     * 将collection数据转化为scene
     * @param  array scenes 场景数据
     * @return array 场景名称数组
     */
    createscenes: function (scenes) {
        var scene_names = [];
        for (var i = 0; i < scenes.length; i++) {
            var scene = scenes[i];
            var scene_name = this.createscene(scene);
            scene_names.push(scene_name);
        }
        return scene_names;
    },

    /**
     * 加载xml数据
     * @param  string xml 数据字符
     * @return this
     */
    loadxml: function (xml) {
        //xml = escape(xml);
        this.krpano.call("loadxml(" + xml + ", null, MERGE, BLEND(1.0))");
        return this;
    },

    /**
     * 加载远程配置文件
     * @param  string xmlpath 配置地址
     * @return this
     */
    loadpano: function (xmlpath) {
        this.krpano.call("loadpano(" + xmlpath + ")");
        return this;
    },

    /**
     * 播放器事件绑定
     * @param  string   eventName 绑定的事件名称
     * @param  function func      绑定的执行函数
     * @return this
     */
    on: function (eventName, func) {
        var eventNames = eventName.split(" ");
        for (var i = 0; i < eventNames.length; i++) {
            if (this.inArray(eventNames[i], this.eventSupport)) {
                this.events[eventNames[i]].push(func);
            } else {
                this.trace("unknew event: " + eventNames[i]);
            }
        }
        return this;
    },
    /**
     * 解除事件绑定
     * @param  string   eventName 事件名称
     * @param  function func      绑定执行的函数
     * @return this
     */
    unon: function (eventName, func) {
        for (var i = 0; i < this.events[eventName].length; i++) {
            if (this.events[eventName][i] == func) {
                this.events[eventName][i].splice(i, 1);
            }
        }
        return this;
    },

    /**
     * 延时执行
     * @param  mixed      arg1       当传入两个参数时，为延迟的时间（单位为S）；当传入三个参数时，为指定ID号
     * @param  mixed      arg2       当传入两个参数时，为执行的function；当传入三个参数时，为延时时间（单位为S）
     * @param  function   arg3       当传入三个参数时，为指定的function
     * @return {[type]}            [description]
     */
    delayedcall: function (arg1, arg2, arg3) {
        var self = this;
        if (typeof arg3 == 'function') {
            this.delayedCallIds[arg1] = setTimeout(function () {
                arg3.call(self);
            }, parseInt(arg2 * 1000));
        } else {
            if (typeof arg2 == 'function') {
                setTimeout(function () {
                    arg2.call(self);
                }, parseInt(arg1 * 1000));
            }
        }
        return this;
    },

    /**
     * 停止delayedcall执行
     * @param string id 指定delayedcall时对应的ID号
     * @return this
     */
    stopdelayedcall: function (id) {
        if (typeof this.delayedCallIds[id] != 'undefined') {
            clearTimeout(this.delayedCallIds[id]);
            delete this.delayedCallIds[id];
        }
        return this;
    },

    /**
     * 调用播放器的call方法
     * @param  string str 执行的语句
     * @return this
     */
    call: function (str) {
        this.krpano.call(str);
        return this;
    },

    /**
     * krpano的trace方法
     * @param  string str 需要打印的信息
     * @return this
     */
    trace: function (str) {
        return this.call("trace('" + str + "')");
    },

    /**
     * 调用播放器的get方法
     * @param  string key 获取的值的键值
     * @return mixed
     */
    get: function (key) {
        return this.krpano.get(key);
        // return this.call("get(" + key + ")");
    },

    /**
     * 设置播放器内变量值
     * @param string key 设置变量的键值
     * @param mixed  val 变量对应的值
     * @return this
     */
    set: function (key, val) {
        // this.krpano.set(key, val);
        this.krpano.call('set(' + key + ',' + val + ')');
        return this;
    },

    /**
     * html转义
     * @param  string text 需要转义的文字
     * @return string
     */
    htmlspecial: window.htmlspecial,

    /**
     * 判断值是否在数组中存在
     * @param  mixed val   查找的值
     * @param  array array 用于查找的数组
     * @return boolean
     */
    inArray: function (val, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == val) {
                return true;
            }
        }
        return false;
    }
};