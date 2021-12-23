//隐藏空间
(function(){

var uid分配器 = {
	最大uid : 0,
	分配 : function(){
		this.最大uid += 1;
		return this.最大uid;
	}
}

//角色大图鉴是一张不可修改表，包括各个角色类型（以角色名表示）的角色初始化参数。
//图标：角色图标名数组，其中有该角色可能在游戏中出现的所有图标的图标名。
//初始HP即最大HP，且HP补满。
//某些需要角色残血出场的情况该怎么办？答：创建角色以后再对角色调整。
var 角色大图鉴 = {
	大雄 : {
		初始权限码 : 5,
		图标 : ["大雄图标", "北诞老人图标"],
		初始图标名 : "北诞老人图标",
		初始主头像名 : "北诞老人头像",
		初始连携头像名 : "黑化的大雄头像",
		初始HP : 9500
	},
	哆啦A梦 : {
		初始权限码 : 5,
		图标 : ["哆啦A梦图标"],
		初始图标名 : "哆啦A梦图标",
		初始主头像名 : "普通的哆啦A梦头像",
		初始连携头像名 : null,
		初始HP : 2000
	}
}

//角色对象可能会有无法估量个，所以需要使用prototype减少方法数量。
function 角色(名字, 初始列号, 初始行号){
	var that = this;
	that.uid = uid分配器.分配();//因为存在同名角色，需要一个uid来唯一标识一名角色。
	that.角色名 = 名字;
	//角色权限码描述了角色的身份权限。每一位对应一个身份权限。
	//1：我方角色身份权限
	//2：敌方角色身份权限
	//4：小型角色身份权限
	that.角色权限码 = 角色大图鉴[名字].初始权限码;
	that.当前图标名 = 角色大图鉴[名字].初始图标名;
	//当前角色可能不显示在地图上，但却有其他需要显示该角色的图标的情景。
	//因此并不使用当前图标名为null来表示当前角色的显示情况，而是另外设置字段。
	that.角色图标显示中 = true;
	//图标字典表以 角色图标元件名 : 角色图标元件实例 的键值对构成。
	//通过对图标元件的构造来实现，并不直接修改图标。
	that.图标字典表 = {};
	for(角色图标元件名 of 角色大图鉴[名字].图标){
		that.图标字典表[角色图标元件名] = new lib[角色图标元件名]();
		that.图标字典表[角色图标元件名].visible = false;
	}
	
	//两个头像名都是字符串，设置参数也是字符串
	that.当前主头像名 = 角色大图鉴[名字].初始主头像名;
	that.当前连携头像名 = 角色大图鉴[名字].初始连携头像名;

	//对于每个角色都有操作状态，这个操作状态主要是用于在下属性条导入角色后控制其按钮可用性的，有以下几种
	//不可操作	不是该角色的回合，该角色没有任何操作权限
	//未移动	角色移动前，可以移动，可以直接使用任何道具，可以整理道具。移动后可以选择“追加行动”或“移动完毕"
	//移动中	角色移动后选择“雷厉风行”，只能使用轻便型道具，不可再移动，不可整理道具，不可使用即时性道具。
	//			追加行动如果撤销，将退回至未移动状态。在追加行动中使用道具会得到突袭度加成。
	//			注：传送道具属于整理道具的范畴，也就是说在追加行动中不可以传递道具。
				//雷厉风行文本说明：移动后未经喘息就立即使用装备开始了行动。由于行动的对象面对刚刚移动的对手没有作出最佳的迎敌姿态，因此会受到加成哦~
	//已移动	角色移动后选择“移动完了”，然后再控制角色，不可再移动，可以使用轻便型道具，可以整理道具，可以使用即时性道具。
				//移动完了文本说明：移动后可以稍微整顿一下再行动哦~不过尽管只是短暂的整顿时间，对手也已经整理好自己的迎敌姿态了。
	//已行动	角色使用操作类道具后，可以整理道具，不能进行其他操作。

	that.操作状态 = "不可操作";

	//是否要考虑多格角色？我的答案是宁愿将多格角色视作多个单格角色的组合
	that.位置x = 初始列号;
	that.位置y = 初始行号;
	//参考位置用于移动中。实际上各个道具使用时的UI皆以参考位置为基准。
	//在UI选择了位置而未确定位置，留有撤销余地时，参考位置改变，位置不改变。
	//但反过来，当操作确定，如果位置改变，参考位置会立刻跟随位置改变。
	that.参考位置x = that.位置x;
	that.参考位置y = that.位置y;
	that.最大HP值 = 角色大图鉴[名字].初始HP;
	that.当前HP值 = that.最大HP值;
	that.手部装备列表 = [];
	that.头部装备列表 = [];
	that.特殊装备列表 = [];
	that.备给列表 = [];

	if(that.原型方法已创建 !== true){
		角色.prototype.原型方法已创建 = true;
		角色.prototype.当前角色头像名设置 = function(主头像名, 连携头像名){
			that.当前主头像名 = 主头像名;
			that.当前连携头像名 = 连携头像名;
		}
		角色.prototype.图标切换 = function(图标名){
			if(!that.图标字典表.hasOwnProperty(图标名)){
				//不能切换一个不存在的图标名
				return;
			}
			if(当前图标名 != null){
				that.图标字典表[当前图标名].visible = false;
			}
			that.当前图标名 = 图标名;
			if(that.角色图标显示中){
				that.图标字典表[图标名].visible = true;
			}
		}
	}
}

//所有的角色根据uid : 对象 这样的方式组成映射集。uid的类型是number
var 角色映射集 = new Map();
//剧情角色花名册是一张 剧情重要角色名 : uid 的对应表。
//要注意这里的角色名并非该角色对象的实际名字，而是剧情中为了方便指代而用的另一个名字
//比如游戏里可以生成多个上等兵，但是其中一个上等兵有剧情，我们可以给这个上等兵在剧情中起名为"剧情上等兵1"
var 剧情角色花名册 = {};

function 角色集控制器(){
	var that = this;
	that.创建 = function(角色名, 初始列号, 初始行号, 角色剧情名){
		let 角色实例 = new 角色(角色名, 初始列号, 初始行号);
		角色映射集.set(角色实例.uid, 角色实例);
		if(arguments.length > 3){
			剧情角色花名册[角色剧情名] = 角色实例.uid;
		}
		return 角色实例;
	}
	that.创建并导入地图 = function(地图实例, 角色名, 初始列号, 初始行号, 角色剧情名){
		var 角色实例;
		if(arguments.length > 4) {
			角色实例 = that.创建(角色名, 初始列号, 初始行号, 角色剧情名);
		}
		else {
			角色实例 = that.创建(角色名, 初始列号, 初始行号);
		}
		地图实例.导入角色(角色实例);
		return 角色实例;
	}
	that.获取实例 = function(角色标识) {
		//角色标识有两可能，其一是number类型的uid，其二是string类型的角色剧情名，其三是我自己已经是角色实例了
		//为什么要有其三，因为有很多根据输入角色标识不同来获取实例的函数，如果每次输入一个实例都要额外判定太耗时间了
		//所以获取实例允许输入就是一个实例，输出我自己
		if(typeof 角色标识 === 'number'){
			return 角色映射集.get(角色标识);
		}
		else if(typeof 角色标识 === 'string'){
			return 角色映射集.get(剧情角色花名册[角色标识]);
		}
		else {
			return 角色标识;
		}
	}
}

cls.角色集控制器 = 角色集控制器;
}());