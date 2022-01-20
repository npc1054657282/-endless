(function(){
//请注意，本人定义的含参事件只能用于自定义事件，不能用于原生事件如click等
class 含参事件 {
	constructor(所属分发器, 事件名, 执行体优先度判定器) {
        let that = this;
        that.所属分发器 = 所属分发器;
        that.事件名 = 事件名;
        that.执行体优先度判定器 = 执行体优先度判定器;
//在监听一个事件的时候，可以同时添加一个判定对象，这个对象可以帮助执行体优先度判定器来排列事件发生时的函数执行顺序
//当然如果没有执行体优先度判定器，就不会起效，而是仅根据绑定事件的顺序决定执行体队列。
        that.事件执行体及其判定对象队列 = [];
        that.分发计数器 = 0;
        //分发事件参数映射集以 分发id : 分发事件参数数组 来映射
        that.分发事件参数映射集 = new Map();
        //监听启动
        that.所属分发器.addEventListener(that.事件名 + that.计数分发器, that.内部执行体.bind(that));
    }
    执行体队列去重排序() {
        let that = this;
        //去重
        that.事件执行体及其判定对象队列 = [...new Set(that.事件执行体及其判定对象队列)];
        //排序
        if (执行体优先度判定器) {
            that.事件执行体及其判定对象队列.sort(that.执行体优先度判定器);
        }
    }
    内部执行体(e) {
        let that = this;
        let eStr = e.type;
        let 分发id = parseInt(eStr.substring(eStr.lastIndexOf("_") + 1));
        //一旦确定了一次执行，这次执行期间对执行队列产生的变动就不会影响这次执行序列本身。
        let 事件执行体及其判定对象队列 = [...that.事件执行体及其判定对象队列];
        for (let 事件执行体及其判定对象 of 事件执行体及其判定对象队列) {
            事件执行体及其判定对象.执行体.call(所属分发器, ...that.分发事件参数映射集.get(分发id));
        }
        that.所属分发器.removeEventListener(that.事件名 + 分发id, that.内部执行体);
        that.分发事件参数映射集.delete(分发id);
    }
    事件触发(...args) {
        let that = this;
        let 分发id = that.分发计数器;
        that.分发事件参数映射集.set(分发id, [...args]);
        that.所属分发器.dispatchEvent(that.事件名 + 分发id);
        that.分发计数器 += 1;
        that.所属分发器.addEventListener(that.事件名 + that.分发计数器, that.内部执行体);
    }
    添加监听 (执行体, 判定对象){
        let that = this;
        let 事件执行体及其判定对象 = {
            执行体 : 执行体,
            判定对象 : 判定对象
        };
        that.事件执行体及其判定对象队列.push(事件执行体及其判定对象);
        that.执行体队列去重排序();
    }
    移除监听 (执行体) {
        let that = this;
        for (let index in that.事件执行体及其判定对象队列) {
            if (that.事件执行体及其判定对象队列[index].执行体 === 执行体){
                that.事件执行体及其判定对象队列.splice(index, 1);
                return;
            }
        }
    }
}
//将一个继承自EventDispatcher的类扩展为一个拥有含参事件分发能力的类
//每个含参事件分发器类都该有一个含参事件图鉴，以为其对象在使用分发能力时生成一个含参事件分发字典表
含参事件.含参事件分发能力扩展器 = function(事件分发类, 含参事件图鉴) {
    事件分发类.prototype.创建含参事件分发字典表 = function(含参事件图鉴) {
        let that = this;
        that.含参事件分发字典表 = {};
        for (事件名 in (含参事件图鉴 || {})) {
            that.含参事件分发字典表[事件名] = new 含参事件(that, 事件名, 含参事件图鉴[事件名].优先度判定器);
        }
        return that.含参事件分发字典表;
    }
    事件分发类.prototype.事件触发 = function(事件名, ...args) {
        let that = this;
        let 含参事件分发字典表 = that.含参事件分发字典表 || that.创建含参事件分发字典表(含参事件图鉴);
        if (含参事件分发字典表[事件名] === undefined) {
            含参事件分发字典表[事件名] = new 含参事件(that, 事件名, undefined);
        }
        含参事件分发字典表[事件名].事件触发(...args);
    }
    事件分发类.prototype.添加监听 = function(事件名, 执行体, 判定对象) {
        let that = this;
        let 含参事件分发字典表 = that.含参事件分发字典表 || that.创建含参事件分发字典表(含参事件图鉴);
        if (含参事件分发字典表[事件名] === undefined) {
            含参事件分发字典表[事件名] = new 含参事件(that, 事件名, undefined);
        }
        含参事件分发字典表[事件名].添加监听(执行体, 判定对象);
    }
    事件分发类.prototype.移除监听 = function(事件名, 执行体) {
        let that = this;
        let 含参事件分发字典表 = that.含参事件分发字典表 || that.创建含参事件分发字典表(含参事件图鉴);
        if (含参事件分发字典表[事件名] === undefined) {
            含参事件分发字典表[事件名] = new 含参事件(that, 事件名, undefined);
        }
        含参事件分发字典表[事件名].移除监听(执行体);
    }
}
cls.含参事件 = 含参事件;

function 纯含参事件分发器(含参事件图鉴) {
    let that = this;
    that.EventDispatcher_constructor();
    let 含参事件分发字典表 = {};
    for (事件名 in (含参事件图鉴 || {})) {
        含参事件分发字典表[事件名] = new 含参事件(that, 事件名, 含参事件分发字典表[事件名].优先度判定器);
    }
    that.含参事件分发字典表 = 含参事件分发字典表;
}
var p = createjs.extend(纯含参事件分发器, createjs.EventDispatcher);
含参事件.含参事件分发能力扩展器(纯含参事件分发器, undefined);
cls.纯含参事件分发器 = createjs.promote(纯含参事件分发器, "EventDispatcher");

//含参事件图鉴example = {
//  事件1 : {优先度判定器 : 判定器1},
//  事件2 : {优先度判定器 : undefined},
//}

})();