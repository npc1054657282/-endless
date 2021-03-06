//隐藏空间
(function(){

//门禁大图鉴是一张静态表。门禁集合里保存的都是标识门禁名的字符串，而具体的门禁掩码则通过门禁大图鉴来获取。
//权限掩码都是大整数BigInt类型，以容纳无限的权限量
var 门禁大图鉴 = {
	绝对禁止门禁 : 0n,
};

class 直接通路 {
	constructor(方式, 距离, 门禁集合, 起点标识, 终点标识, 终点位置x, 终点位置y) {
		let that = this;
		that.uid = UID.分配(that);
		//通路方式有"上""下""左""右""跃迁"5种，方向仅仅用来指导移动动画。
		that.方式 = 方式;
		that.起点uid = 格子.获取实例(起点标识).uid;
		if (终点标识) {
			that.终点uid = 格子.获取实例(终点标识).uid;
		}
		//在格子初始化的时候，会顺带初始化直接通路。
		//但是由于这时候格子周边的格子可能还没初始化，所以终点没有办法立即输入
		//所以只能输入终点位置作为代替。然后用一个终点getter方法来懒加载。
		that._终点位置x = 终点位置x;
		that._终点位置y = 终点位置y;
		that.距离 = 距离;
		that.门禁集合 = 门禁集合;
	}
	通路门禁检验(权限码) {
		let that = this;
		for (let 门禁 of that.门禁集合) {
			if (门禁大图鉴[门禁] & 权限码 === 0) {
				return false;
			}
		}
		return true;
	}
	get 起点() {
		return UID.获取实例(this.起点uid);
	}
	get 终点() {
		let that = this;
		if (!that.终点uid) {
			that.终点uid = that.起点.所属地图.二维格子uid数组[that._终点位置x][that._终点位置y];
		}
		return UID.获取实例(that.终点uid);
	}
}

//一个格子可以承载一个角色集合和一个场景集合
//一般一个格子里的角色最多只能有一个，但如果有特殊的场景，可能可以承载复数个角色
class 格子 {
	constructor(列号, 行号, 所属地图标识) {
		var that = this;
		that.uid = UID.分配(that);
		//既然没有选择闭包，那总要留一个属性来保存所属地图，没办法。
		that.所属地图uid = cls.地图.获取实例(所属地图标识).uid;
		that.位置x = 列号;
		that.位置y = 行号;
		//格子有多个准入门禁
		//一个角色进入一个格子时，需要用他的身份掩码去和每个准入门禁配对
		//对于一个门禁，只要相与不为0，则通过门禁
		//有多个准入门禁，需要所有门禁都通过，才能进入格子
		//这里的集合都是准入门禁名的字符串。由准入门禁大图鉴来将准入门禁名与准入门禁掩码配对
		//要注意角色还是有可能在移动中通过准入门禁的，如果想让角色移动中受到障碍，请控制通路集合
		that.准入门禁集合 = new Set();
		//有的场景会使得某些准入门禁失效，但当这些场景消失后，失效的准入门禁会重新生效。因此需要暂存它们。
		that.失效准入门禁集合 = new Set();
		//弹道门禁用于检查子弹的起点和终点能否经过。
		that.弹道门禁集合 = new Set();
		that.失效弹道门禁集合 = new Set();
		//直接通路uid集合，里面放的是这个格子与其他格子间的所有直接通路对象的uid。一般总是有上下左右通路各一条，除边角外。
		//场景可以直接影响本格的通路，也可以影响本格上下左右方向的格子到本格的"上下左右"通路，但一般不能影响其他格子的"跃迁"通路
		//注意，一个格子到相同另一个格子可能有多条通路，
		//例如同样是到"上"的相邻格子，有的是消耗2点距离的通路，有的则只消耗1点。这两条通路的通路门禁不同。
		that.直接通路uid集合 = new Set();
		//场景也会对通路产生影响，但是场景一般影响的范围包括周边处理方法与准入门禁直接增加或溢出门禁不太一样
		//有时候是给某些角色增加近道，这时候会直接增加新通路，这些新通路有放行这些角色的门禁
		//有的时候则是使某些角色移动更困难，这时候会将原通路失效，然后增加屏蔽这些角色的门禁的通路，以及增加了仅仅用来标识没有屏蔽效果的门禁，但是距离更长的通路
		//这时候失效的原通路的uid会放在失效直接通路uid集合里。
		that.失效直接通路uid集合 = new Set();
		//下面初始化直接通路。要注意，在这里的直接通路要用一种特殊的方式来初始化，
		//终点设为undefined，作为代替输入终点位置x和终点位置y
		//这是因为格子在创建的时候其周边格子未必已经创建了，因此这里选择以懒加载的方式来输入终点。
		//如果本格的列号大于0，认为初始化时它有向左的通路
		if (列号 > 0) {
			that.直接通路uid集合.add((new 直接通路("左", 1, new Set(), that.uid, undefined, 列号 - 1, 行号)).uid);
		}
		//如果本格的行号大于0，认为初始化时它有向上的通路
		if (行号 > 0) {
			that.直接通路uid集合.add((new 直接通路("上", 1, new Set(), that.uid, undefined, 列号, 行号 - 1)).uid);
		}
		//如果本格的列号小于列数 - 1，认为初始化时它有向右的通路
		if (列号 < that.所属地图.列数 - 1) {
			that.直接通路uid集合.add((new 直接通路("右", 1, new Set(), that.uid, undefined, 列号 + 1, 行号)).uid);
		}
		//如果本格的列号小于行数 - 1，认为初始化时它有向下的通路
		if (行号 < that.所属地图.行数 - 1) {
			that.直接通路uid集合.add((new 直接通路("下", 1, new Set(), that.uid, undefined, 列号, 行号 + 1)).uid);
		}

		//如果一个格子的角色集合和场景集合的对象数量之和为1，
		//点击这个格子会显示其UI属性条。
		//如果一个格子的角色集合和场景集合的对象数量之和为0，
		//点击无反应（可以用于撤销动作）
		//如果一个格子的角色集合和场景集合的对象数量之和大于1，
		//弹出一个对话框，选择具体要控制的对象。
		that.角色uid集合 = new Set();
		that.场景uid集合 = new Set();

		//这个缓存集合由 角色权限 : 广度优先格点通路搜索缓存对象 构成
		//针对每个角色权限，都利用广度优先算法设计了格点通路搜索缓存
		//格点通路搜索缓存是个挺复杂的对象，这里将其作为一个私有类来描述
		//注意，所有加下划线的属性，我们约定在序列化时会绕过，也就是通路缓存不会被存档。
		that._各角色权限广度优先格点通路搜索缓存映射集 = new Map();
	}
	get 所属地图() {
		return UID.获取实例(this.所属地图uid);
	}
	get 各角色权限广度优先格点通路搜索缓存映射集() {
		return this._各角色权限广度优先格点通路搜索缓存映射集;
	}
	获取中心像素点() {
		let that = this;
		return new createjs.Point(that.位置x * 32 + 16, that.位置y * 32 + 16);
	}
	//通路搜索有两种不同的需求——
	//搜索指定距离通达格子集合：返回所有与本格子相距低于指定最大目标距离的格子的集合。
	//搜索目标格子通路列表：返回目标格的通路信息数组列表（有序）。
	//这里只是打个包装，如果对应的对象没有定义则创建一个。实际上都是交给下层去做。
	搜索指定距离内通达格子集合(角色权限, 最大距离) {
		let that = this;
		let 搜索缓存集 = that.各角色权限广度优先格点通路搜索缓存映射集.get(角色权限);
		if (搜索缓存集 === undefined) {
			搜索缓存集 = new 广度优先格点通路搜索缓存(that, 角色权限);
			that.各角色权限广度优先格点通路搜索缓存映射集.set(角色权限, 搜索缓存集);
		}
		return 搜索缓存集.搜索指定距离内通达格子集合(最大距离);
	}
	搜索目标格子通路列表(角色权限, 目标格标识) {
		let that = this;
		let 搜索缓存集 = that.各角色权限广度优先格点通路搜索缓存映射集.get(角色权限);
		if (搜索缓存集 === undefined) {
			搜索缓存集 = new 广度优先格点通路搜索缓存(that, 角色权限);
			that.各角色权限广度优先格点通路搜索缓存映射集.set(角色权限, 搜索缓存集);
		}
		return 搜索缓存集.搜索目标格子通路列表(目标格标识);
	}
}
格子.获取实例 = function(格子标识) {
	if (typeof 格子标识 === "bigint") {
		return UID.获取实例(格子标识);
	}
	else {
		return 格子标识;
	}
}
cls.格子 = 格子;

//这个对象是一个指定起点的，指定角色权限的通路搜索缓存。
//缓存是不存档的，所以里面直接使用格子的实例
class 广度优先格点通路搜索缓存 {
	constructor(起点格, 角色权限) {
		let that = this;
		//既然没有选择闭包，总要留一个属性保存起点格子
		that.通路起点 = 起点格;
		that.角色权限 = 角色权限;
		//其他随地图版本重置的属性会在重置方法里实现。
		that.重置();
	}
	//类似于一个内置类通路信息的构造器
	//通路信息只在本起点内生效，不可被其他起点复用。
	static 创建通路信息(总距离, 末端直接通路) {
		return {
			总距离 : 总距离,
			末端直接通路 : 末端直接通路
		}
	}
	重置() {
		let that = this;
		//每个缓存集有一个缓存版本，在使用缓存前校对缓存版本与地图版本
		//如果缓存版本较低，则缓存映射集清空，缓存层数清零，缓存完整性为假，缓存版本更新
		that.缓存版本 = that.通路起点.所属地图.地图版本;
		//根据迪杰斯特拉算法，将搜索缓存分为可靠缓存映射集和前线缓存映射集
		//由 目标格子 : 通路信息对象 组成
		delete that.可靠缓存映射集;
		that.可靠缓存映射集 = new Map();
		//前线缓存映射集本身是可以通过优先队列来实现，以快速获取其中总距离最小节点的。
		//但是我们的地图的通路实在太稠密了，优先队列得不偿失。
		delete that.前线缓存映射集;
		that.前线缓存映射集 = new Map();
		that.前线缓存映射集.set(that.通路起点, 广度优先格点通路搜索缓存.创建通路信息(0, null));
		//最小前线距离用来保存前线缓存映射集中的最小距离，它用于在搜索缓存扩张时确保扩张条件满足的可靠性。
		//最小前线距离可以用来表示缓存的完整性，如果最小前线距离为null，说明前线缓存映射集为空
		//这表明前线以该点为起点的地图可达路径已经完全搜索
		//这也意味着此时如果搜索此起点到某个点为undefined，是真的没有，而不是还没有搜索到
		that.最小前线距离 = 0;
		//前线候补格是在刷新最小前线距离时获取的，它是前线缓存映射集中满足最小前线距离的一格
		//每一次迪杰斯特拉迭代都会把前线候补格送进可靠缓存映射集中，
		//同时必须立刻在前线缓存映射集中将刷新该候补格的直接通路目的格（如果目的格不在可靠缓存映射集中的话）
		that.前线候补格 = that.通路起点;
	} //重置 方法结束
	刷新最小前线距离与前线候补格() {
		let that = this;
		that.最小前线距离 = null;
		for (let [当前格, 当前前线通路信息] of that.前线缓存映射集) {
			let 当前距离 = 当前前线通路信息.总距离;
			if (that.最小前线距离 === null) {
				that.最小前线距离 = 当前距离;
				that.前线候补格 = 当前格;
			}
			else if (that.最小前线距离 > 当前距离) {
				that.最小前线距离 = 当前距离;
				that.前线候补格 = 当前格;
			}
		}
	}
	//纯迪杰斯特拉算法，只影响本起点的缓存
	//不会对以其他格子为起点的缓存施加任何影响
	搜索缓存扩张(停止扩张条件函数) {
		let that = this;
		//首先检查版本是否过期
		if (that.通路起点.所属地图.地图版本 !== that.缓存版本) {
			that.重置();
		}
		//迪杰斯特拉算法本体
		//每一次扩张迭代都检查一下是否满足停止扩张条件。
		while (that.最小前线距离 !== null && !停止扩张条件函数()) {
			//迪杰斯特拉算法的一轮迭代围绕着前线候补格进行。
			//首先将它从前线缓存映射集移除，并放进可靠缓存映射集中
			//注意，算法决定了前线候补格一定在前线缓存映射集里，否则肯定出了问题。
			let 前线候补通路信息 = that.前线缓存映射集.get(that.前线候补格);
			that.前线缓存映射集.delete(that.前线候补格);
			that.可靠缓存映射集.set(that.前线候补格, 前线候补通路信息);
			//搜索前线候补格的所有直接通路
			for (let 扩张直接通路uid of that.前线候补格.直接通路uid集合) {
				let 扩张直接通路 = UID.获取实例(扩张直接通路uid)
				//先检查有没有权限，没有权限直接跳过
				if (!扩张直接通路.通路门禁检验(that.角色权限)) {
					continue;
				}
				let 扩张目的格 = 扩张直接通路.终点;
				//检查该直接通路的目的地是否已经在可信缓存映射集里，
				//如果是，直接跳过
				if (that.可靠缓存映射集.get(扩张目的格)) {
					continue;
				}
				//如果该直接通路的目的地不存在于前线缓存集，直接加入前线缓存集
				//此时会新建到扩张目的格的通路信息，末端直接通路为扩张直接通路
				//总距离为到前线候补格的距离（最小前线距离）与扩张直接通路的距离之和
				let 总距离 = that.最小前线距离 + 扩张直接通路.距离;
				let 前线已有目的通路信息 = that.前线缓存映射集.get(扩张目的格);
				if (前线已有目的通路信息 === undefined) {
					that.前线缓存映射集.set(扩张目的格, 广度优先格点通路搜索缓存.创建通路信息(总距离, 扩张直接通路));
					continue;
				}
				//如果前线缓存集已经有了该直接通路的目的地，则需要进行一个比较
				//新判定的扩张直接通路如果总距离更优，则更新信息。否则什么也不干。
				if (总距离 < 前线已有目的通路信息.总距离) {
					前线已有目的通路信息.总距离 = 总距离;
					delete 前线已有目的通路信息.末端直接通路;
					前线已有目的通路信息.末端直接通路 = 扩张直接通路;
				}
			}
			//前线缓存映射集更新完毕，重新刷新一下最小前线距离与前线候补格
			that.刷新最小前线距离与前线候补格();
			//开启下一轮迭代
		}
		return;
	} //搜索缓存扩张 方法结束
	搜索指定距离内通达格子集合(最大距离) {
		let that = this;
		that.搜索缓存扩张(function () {
			if (that.最小前线距离 > 最大距离) {
				return true;
			}
			return false;
		});
		let 结果集合 = new Set();
		for (let [检验格, 检验通路信息] of that.可靠缓存映射集) {
			if (检验通路信息.总距离 <= 最大距离) {
				结果集合.add(检验格);
			}
		}
		return 结果集合;
	}
	搜索目标格子通路列表(目标格标识) {
		let that = this;
		let 目标格 = 格子.获取实例(目标格标识);
		that.搜索缓存扩张(function () {
			if (that.可靠缓存映射集.get(目标格)) {
				return true;
			}
			return false;
		});
		let 结果列表 = [];
		let 末端格 = 目标格;
		//扩张搜索缓存后，开始依次从末端到起点插入结果列表
		//当直接通路追溯到起点时终止
		while (末端格 !== that.通路起点) {
			let 末端直接通路 = that.可靠缓存映射集.get(末端格).末端直接通路;
			结果列表.unshift(末端直接通路);
			末端格 = 末端直接通路.起点;
		}
		return 结果列表;
	}
}

function 地图UI容器(所属地图实例){
	var that = this;
	that.Container_constructor();
	that.地图版面 = new lib.元件地图版面();
	that.addChild(that.地图版面);
	//可以通过	that.setChildIndex(图标, that.getChildIndex(that.xxx存根))将一个图标移到对应图层最高位置
	//底层场景的最高位置
	that.底层场景存根 = new createjs.DisplayObject();
	that.addChild(that.底层场景存根);
	//角色图层的最高位置
	that.角色图层存根 = new createjs.DisplayObject();
	that.addChild(that.角色图层存根);
	//顶层场景的最高位置
	that.顶层场景存根 = new createjs.DisplayObject();
	that.addChild(that.顶层场景存根);
	that.地图滤镜实例 = new createjs.Shape();
	that.addChild(that.地图滤镜实例);
	that.图标光标UI实例 = new lib.元件图标光标();
	that.图标光标UI实例.visible = false;
	that.addChild(that.图标光标UI实例);

	//对于UI来说，可以直接在对象里保存对象，不用非要通过uid转换。
	that.地图实例 = 所属地图实例;

	that.鼠标像素点 = null;//createjs.Point对象，指示鼠标在地图内的像素位置x和y。要和全局的鼠标像素点区别开哦
	that.鼠标所在格 = null;//要注意鼠标所在格可能在地图外面，使用时需要判定其是否存在。
	that.鼠标所在半格界列 = undefined;
	that.鼠标所在半格界行 = undefined;

	//这一版地图操作操作状态的设计很可能将被完全废弃！新设计将基于操作请求而非操作状态机。
	//地图操作状态机用于标识点击地图各个格子时的操作UI逻辑。
	//现在计划用"指令事件"+指令参数对象的模式，而地图操作状态只是一个指令参数的载体。
	//这种模式是为了玩家与AI的操作统一化。这些事件会影响画面显示，这些画面应该不受玩家操控
	//指令事件是不影响与用户交互有关的UI的，而这里的地图操作状态与用户的操作交互关系很大。
	//不可操作		在剧情中或是AI行动中，点击地图不会有反应。鼠标移动到某些对象上还是会有光标闪烁。
	//				不可操作状态可以用于结算过程中的加锁，进行结算时不可操作，当结算完等待玩家操作再恢复状态。
	//待操作			当你没有操作某个角色，或者正在在操作某个角色的时候
	//					地图都可以是待操作状态，因为这时候你实质上是在操作UI按钮，不是地图本身
	//					这时点击地图时，会关闭当前的所有UI条，
	//					如果地图存在锁定操作角色，会对该角色触发"撤销操作"事件。
	//					然后如果点击的格子里有复数对象，会弹出对话框选定对象
	//					如果点击的格子里只有一个对象，直接弹出下属性条
	//					如果点击的格子没有任何对象，将弹出主控制板。
	//行动范围选择中	使用/传递操作型道具（传递其实可以视为一种特殊的行动），并且已经确定了某个作用范围模板以后。
	//					注意作用选择模板一般是交给按钮控件处理的，所以我们不需要在这里考虑
	//					这时候地图的格子滤镜会生效。鼠标移动到滤镜内，对应的实际作用对象会变为橙色。
	//					如果点击其他地方，关闭所有UI条和滤镜，并触发"撤销操作"事件。
	//					如果点击了橙色的实际作用对象，会计算攻击中心，然后触发"决策进行行动"事件
	//					事件的参数包括：	(如果要传递的道具不在身上，道具所在栏位标识为null)
	//					行动方式（传递或使用），道具对象，道具所在栏位标识，作用范围模板和攻击中心
	//					注意，决策进行行动并不是立刻行动，这时候会检查是否触发接敌，如果不触发接敌会直接进一步触发"进行行动"事件
	//					而如果触发接敌则会触发接敌事件，弹出UI。需要玩家点击来进一步触发"进行行动"事件
	//移动范围选择中	虽然移动的时候，地图的UI滤镜和使用或者传递道具非常接近，但是移动和其他行动的滤镜计算方式本质是不同的
	//					因此移动范围选择中是特殊的地图操作状态
}
var p = createjs.extend(地图UI容器,createjs.Container);
p.获取像素点所在格uid = function(像素点){
	let that = this;
	if(像素点.x >= 0 && 像素点.x < that.地图实例.列数 * 32 && 像素点.y >= 0 && 像素点.y < that.地图实例.行数 * 32){
		return that.地图实例.二维格子uid数组[Math.floor(像素点.x / 32)][Math.floor(像素点.y / 32)];
	}
	else{
		return 0;
	}
}
p.鼠标激活 = function() {
	let that = this;
	createjs.Ticker.addEventListener("tick", function(){
		that.鼠标像素点 = that.globalToLocal(stage.mouseX, stage.mouseY);
		let 鼠标旧所在半格界列 = that.鼠标所在半格界列;
		let 鼠标旧所在半格界行 = that.鼠标所在半格界行;
		that.鼠标所在半格界列 = Math.floor(that.鼠标像素点.x / 16);
		that.鼠标所在半格界行 = Math.floor(that.鼠标像素点.y / 16);
		let 鼠标旧所在格 = that.鼠标所在格;
		that.鼠标所在格 = UID.获取实例(that.获取像素点所在格uid(that.鼠标像素点));
		//当鼠标划过地图上的格子时，如果该格子里有角色或者场景，则光标移动到该格子且显示。否则光标隐藏
		//在当前的设计这个光标实例的移动是与事件无关的，总是会触发。未来可能会移动到鼠标移动至其他格子的事件里
		if(that.鼠标所在格){
			全局.测试文本.text = that.鼠标所在格.位置x + "\n" + that.鼠标所在格.位置y;
			if (that.鼠标所在格.角色uid集合.size > 0 || that.鼠标所在格.场景uid集合.size > 0) {
				let 光标中心像素点 = that.鼠标所在格.获取中心像素点();
				that.图标光标UI实例.set({x : 光标中心像素点.x, y : 光标中心像素点.y});
				that.图标光标UI实例.visible = true;
			}
			else {
				that.图标光标UI实例.visible = false;
			}
		}
		//“半格界”是鼠标移动的最小判断粒度，如果鼠标移动到另一个半格界内，认为鼠标移动了
		//鼠标移动的事件在地图上的判定主要用于选择目标的时候。
		if (鼠标旧所在半格界列 !== that.鼠标所在半格界列 || 鼠标旧所在半格界行 !== that.鼠标所在半格界行) {
			全局.UI事件分发器.事件触发("鼠标移动", that.鼠标所在格);
		}
		//另外，如果鼠标移动到另一个格子或者界外，会触发一个判定粒度更粗的UI事件。
		if (鼠标旧所在格 !== that.鼠标所在格) {
			全局.UI事件分发器.事件触发("鼠标移至其他格子", that.鼠标所在格);
		}
	});
}
p.导入角色UI = function(角色标识){
	let that = this;
	//导入角色UI时，被导入的角色的地图图标字典表中的所有图标将被导入到本地图的角色图层中
	//参数“角色”有三种允许的输入，
	//其一：输入bigint类型的uid，
	//其二：输入string类型的角色剧情名
	//其三：输入object类型的角色实例，
	//这三种输入都可以用获取实例来搞定
	var 角色对象 = cls.角色.获取实例(角色标识);
	for (let 角色图标名 in 角色对象.UI控制器.地图图标字典表) {
		let 角色图标实例 = 角色对象.UI控制器.地图图标字典表[角色图标名];
		that.addChild(角色图标实例);
		that.setChildIndex(角色图标实例, that.getChildIndex(that.角色图层存根));
	}
}
p.移除角色UI = function(角色标识){
	let that = this;
	var 角色对象 = cls.角色.获取实例(角色标识);
	for (let 角色图标名 in 角色对象.UI控制器.地图图标字典表) {
		let 角色图标实例 = 角色对象.UI控制器.地图图标字典表[角色图标名];
		that.removeChild(角色图标实例);
	}
}

//导入角色UI只是让新创建的角色的图标素材进入地图，但导入时角色并未实际身处地图上任何一个位置。
//要想显示角色，需要登场角色。登场角色需要在角色位置处播放一个登场影片剪辑元件，然后角色图标显示。
//登场单个角色时，输入参数为一个角色标识和登场位置。登场多个角色时，输入参数为一个角色标识列表。登场多个角色复杂太多，先不实现了。
p.登场单个角色 = function(角色标识, 位置x, 位置y){
	let that = this;
	var 登场角色实例 = cls.角色.获取实例(角色标识);
	var 登场动画实例 = new lib.角色登场动画();
	var 登场角色所在格 = UID.获取实例(that.地图实例.二维格子uid数组[位置x][位置y]);
	登场角色实例.当前所在格uid = 登场角色所在格.uid;
	登场角色所在格.角色uid集合.add(登场角色实例.uid);
	var 登场角色中心像素点 = 登场角色所在格.获取中心像素点();
	登场动画实例.set({x : 登场角色中心像素点.x, y : 登场角色中心像素点.y});
	let 播放计数 = 0;
	登场动画实例.timeline.addTween(createjs.Tween.get(登场动画实例).wait(1).call(function(){
		播放计数 += 1;
		if (播放计数 == 4) {
			登场动画实例.stop();
			that.removeChild(登场动画实例);
			delete 登场动画实例;
			动画播放完毕后的行为();
		}
	}));
	that.addChild(登场动画实例);
	//最新版的createjs里这里的loop可以指定次数，但较旧版的createjs只是个布尔值，想确定循环次数只能多次播放。
	登场动画实例.play();
	let 动画播放完毕后的行为 = function(){
		登场角色实例.当前图标实例.set({x : 登场角色中心像素点.x, y : 登场角色中心像素点.y});
		登场角色实例.地图图标显示(true);
		全局.结算事件分发器.事件触发("角色登场后");
	}
}

//这个函数目前实际上完全没有使用到地图本体的信息。不排除以后会用到
p.移动角色并播放动画 = function(角色标识, 移动目标格标识){
	let that = this;
	let 移动角色实例 = cls.角色.获取实例(角色标识);
	let 移动起点格 = 移动角色实例.当前所在格;
	let 移动目标格 = cls.格子.获取实例(移动目标格标识);
	//获取从起点到终点的通路列表
	let 移动通路列表 = 移动起点格.搜索目标格子通路列表(移动角色实例.权限码, 移动目标格标识)
	if(移动通路列表.length === 0){
		return;
	}
	let 当前通路序号 = 0;
	//距离为0，1帧移完。距离为1，2帧。距离为2，3帧。以此类推（虽然不科学，但表现力最好了）
	//因此每次移动的像素根据 32/(距离+1) 取整计算。当移动进度等于距离直接到达这一通路终点
	let 当前通路移动进度 = 0;
	let 移动角色图标实例 = 移动角色实例.当前图标实例;
	//移动动画目前是一个自动循环的纯粹的动画脚本，没有任何内置元件，因此以纯movieclip创建
	//但以后有可能会给跃迁做特殊动画，那就需要内置元件了
	let 移动单帧脚本 = function(){
		//先检查当前通路进度是否等同于当前通路的距离
		let 当前移动通路 = 移动通路列表[当前通路序号];
		if(当前移动通路.距离 === 当前通路移动进度){
			//如果相等，立即归位
			let 当前移动通路终点中心像素点 = 当前移动通路.终点.获取中心像素点();
			移动角色图标实例.set({alpha : 1, x : 当前移动通路终点中心像素点.x, y : 当前移动通路终点中心像素点.y});
			当前通路序号 += 1;
			if(当前通路序号 === 移动通路列表.length){
				createjs.Ticker.removeEventListener("tick", 移动单帧脚本);
				移动脚本执行完毕后的行为();
			}
			当前通路移动进度 = 0;
			return;
		}
		//不相等，根据不同的移动方式，有不同的进度效果
		switch(当前移动通路.方式){
			case "上":
				移动角色图标实例.y -= Math.trunc(32/(当前移动通路.距离 + 1));
				break;
			case "下":
				移动角色图标实例.y += Math.trunc(32/(当前移动通路.距离 + 1));
				break;
			case "左":
				移动角色图标实例.x -= Math.trunc(32/(当前移动通路.距离 + 1));
				break;
			case "右":
				移动角色图标实例.x += Math.trunc(32/(当前移动通路.距离 + 1));
				break;
			case "跃迁":
				移动角色图标实例.alpha -= 1/(当前移动通路.距离 + 1);
				break;
		}
		当前通路移动进度 += 1;
	}
	createjs.Ticker.addEventListener("tick", 移动单帧脚本);
	let 移动脚本执行完毕后的行为 = function(){
		//把角色的uid从起点格里去掉，在终点格里加入。角色的当前所在格更新
		//但角色的记忆所在格不会更新，以供撤销。
		移动起点格.角色uid集合.delete(移动角色实例.uid);
		移动目标格.角色uid集合.add(移动角色实例.uid);
		移动角色实例.当前所在格uid = 移动目标格标识;
	};
}

cls.地图UI容器 = createjs.promote(地图UI容器, "Container");

//将地图与地图UI容器分成不同的类型，地图拥有uid，而地图UI容器没有。
//在地图的全局属性下通过一个映射表将地图的uid与其对应的地图UI容器映射起来
//存档的时候，仅保存地图相关的信息，读档的时候重新创建地图UI容器，根据地图信息还原。
class 地图 {
	constructor() {
		let that = this;
		that.uid = UID.分配(that);
		that.列数 = 16;
		that.行数 = 12;
		that.二维格子uid数组 = new Array(that.列数);
		for(let i = 0; i < that.列数; i += 1){
			that.二维格子uid数组[i] = new Array(that.行数);
			for(let j = 0; j < that.行数; j += 1){
				that.二维格子uid数组[i][j] = new 格子(i, j, that.uid).uid;
			}
		}
		//地图版本是用来与各个格子的通路搜索缓存有效性作比较的。
		//每当地图上有格子出现权限变更的时候，地图版本就会增加。在使用缓存前比较缓存版本和地图版本
		//如果缓存版本较低，则缓存废除，重新计算
		//地图版本不会被存档，重新加载存档后会从0开始计算。
		that._地图版本 = 0n;
	}
	get UI容器() {
		return 地图.地图uid与地图UI容器映射集.get(this.uid);
	}
	get 地图版本() {
		return this._地图版本;
	}
	导入舞台() {
		stage.addChild(this.UI容器);
	}
	鼠标激活() {
		this.UI容器.鼠标激活();
	}
	导入角色UI(角色标识) {
		this.UI容器.导入角色UI(角色标识);
	}
	移除角色UI(角色标识) {
		this.UI容器.移除角色UI(角色标识);
	}
	登场单个角色(角色标识, 位置x, 位置y) {
		this.UI容器.登场单个角色(角色标识, 位置x, 位置y);
	}
	移动角色并播放动画(角色标识, 移动目标格标识) {
		this.UI容器.移动角色并播放动画(角色标识, 移动目标格标识);
	}
}
地图.地图uid与地图UI容器映射集 = new Map();
地图.创建 = function() {
	let 地图实例 = new 地图();
	let 地图UI容器实例 = new cls.地图UI容器(地图实例);
	地图UI容器实例.setTransform(265.5,196,1,1,0,0,0,246.5,188);
	地图.地图uid与地图UI容器映射集.set(地图实例.uid, 地图UI容器实例);
	return 地图实例.uid;
}
地图.获取实例 = function(地图标识) {
	if(typeof 地图标识 === 'bigint'){
		return UID.获取实例(地图标识);
	}
	else {
		return 地图标识;
	}
}
cls.地图 = 地图;


}());