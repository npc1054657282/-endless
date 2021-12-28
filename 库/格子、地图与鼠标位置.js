//隐藏空间
(function(){
//一个格子可以承载一个角色列表和一个场景列表
//一般一个格子里的角色列表最多只能有一个，但如果有特殊的场景，可能可以承载复数个角色
function 格子(列号, 行号){
	var that = this;
	that.位置x = 列号;
	that.位置y = 行号;
	//格子有多个准入门禁
	//一个角色进入一个格子时，需要用他的身份掩码去和每个准入门禁配对
	//对于一个门禁，只要相与不为0，则通过门禁
	//有多个准入门禁，需要所有门禁都通过，才能进入格子
	//准入门禁字典表以 门禁名 : 门禁掩码 的形式配对，门禁名可以帮助格子方便地添加与移除门禁
	that.准入门禁字典表 = {};
	//如果一个格子的角色列表和场景列表的对象数量之和为1，
	//点击这个格子会显示其UI属性条。
	//如果一个格子的角色列表和场景列表的对象数量之和为0，
	//点击无反应（可以用于撤销动作）
	//如果一个格子的角色列表和场景列表的对象数量之和大于1，
	//弹出一个对话框，选择具体要控制的对象。
	that.角色uid列表 = [];
	that.场景uid列表 = [];
	that.获取中心像素点 = function(){
		return new createjs.Point(that.位置x * 32 + 16, that.位置y * 32 + 16);
	}
}

function 地图纯容器(){
	var that = this;
	that.Container_constructor();
	that.地图实例 = new lib.元件地图实例();
	that.addChild(that.地图实例);
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
	that.图标光标实例 = new lib.元件图标光标();
	that.图标光标实例.visible = false;
	that.addChild(that.图标光标实例);

	that.二维格子数组 = new Array(16);
	for(let i = 0; i < 16; i += 1){
		that.二维格子数组[i] = new Array(12);
		for(let j = 0; j < 12; j += 1){
			that.二维格子数组[i][j] = new 格子(i,j);
		}
	}
	that.鼠标像素点 = null;//createjs.Point对象，指示鼠标在地图内的像素位置x和y。要和全局的鼠标像素点区别开哦
	that.获取像素点所在格 = function(像素点){
		if(像素点.x >= 0 && 像素点.x < 512 && 像素点.y >= 0 && 像素点.y < 384){
			return that.二维格子数组[Math.floor(像素点.x / 32)][Math.floor(像素点.y / 32)];
		}
		else{
			return null;
		}
	}
	that.鼠标所在格 = null;//要注意鼠标所在格可能在地图外面，使用时需要判定其是否存在。
	that.地图鼠标于舞台激活 = function(舞台) {
		createjs.Ticker.addEventListener("tick", function(){
			that.鼠标像素点 = that.globalToLocal(舞台.mouseX, 舞台.mouseY);
			that.鼠标所在格 = that.获取像素点所在格(that.鼠标像素点);
			//当鼠标划过地图上的格子时，如果该格子里有角色或者场景，则光标移动到该格子且显示。否则光标隐藏
			if(that.鼠标所在格){
				全局.测试文本.text = that.鼠标所在格.位置x + "\n" + that.鼠标所在格.位置y;
				if (that.鼠标所在格.角色uid列表.length > 0 || that.鼠标所在格.场景uid列表.length > 0) {
					let 光标中心像素点 = that.鼠标所在格.获取中心像素点();
					that.图标光标实例.set({x : 光标中心像素点.x, y : 光标中心像素点.y});
					that.图标光标实例.visible = true;
				}
				else {
					that.图标光标实例.visible = false;
				}
			}
		});
	}

	//用于指挥角色移动影片剪辑移动哪名角色。
	//移动角色时，先修改角色对象的位置x和位置y，然后创建角色移动影片剪辑并播放。
	//角色移动影片剪辑本质上是只有动作脚本没有其他内容的一个影片剪辑动画。在动画播放前地图操作状态机会变为不可操作，播放后恢复。
	//角色移动影片剪辑分析对象来决定图标往哪里移动。
	that.当前移动角色 = null;

	that.导入角色 = function(角色){
		//导入角色时，被导入的角色的图标字典表中的所有图标将被导入到本地图的角色图层中
		//参数“角色”有三种允许的输入，
		//其一：输入number类型的uid，
		//其二：输入string类型的角色剧情名
		//其三：输入object类型的角色实例，
		//这三种输入都可以用获取实例来搞定
		var 角色对象 = 全局.角色.获取实例(角色);
		for (角色图标名 in 角色对象.图标字典表) {
			let 角色图标实例 = 角色对象.图标字典表[角色图标名];
			that.addChild(角色图标实例);
			that.setChildIndex(角色图标实例, that.getChildIndex(that.角色图层存根));
		}
	}
	that.移除角色 = function(角色){
		var 角色对象 = 全局.角色.获取实例(角色);
		for (角色图标名 in 角色对象.图标字典表) {
			let 角色图标实例 = 角色对象.图标字典表[角色图标名];
			that.removeChild(角色图标实例);
		}
	}

	//导入角色只是给新创建的角色一个容身之所，但导入时角色并未在地图上显示。
	//要想显示角色，需要登场角色。登场角色需要在角色位置处播放一个登场影片剪辑元件，然后角色图标显示。
	//登场单个角色时，输入参数为一个角色标识。登场多个角色时，输入参数为一个角色标识列表。登场多个角色复杂太多，先不实现了。
	that.登场单个角色 = function(角色){
		var 登场角色实例 = 全局.角色.获取实例(角色);
		var 登场动画实例 = new lib.角色登场动画();
		var 登场角色所在格 = that.二维格子数组[登场角色实例.位置x][登场角色实例.位置y];
		登场角色所在格.角色uid列表.push(登场角色实例.uid);
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
			登场角色实例.获取当前图标实例().set({x : 登场角色中心像素点.x, y : 登场角色中心像素点.y});
			登场角色实例.图标显示(true);
		}
	}

	//地图操作状态机用于标识点击地图各个格子时的操作逻辑
	//不可操作		在剧情中或是AI行动中，点击地图不会有反应。鼠标移动到某些对象上还是会有光标闪烁。
	//				不可操作状态可以用于结算过程中的加锁，进行结算时不可操作，当结算完等待玩家操作再恢复状态。
	//待操作		点击地图时，会关闭当前的所有UI条，如果存在当前操作角色，其参考位置归位于真实位置。
	//				然后如果点击的格子里有复数对象，会弹出对话框选定对象
	//				如果点击的格子里只有一个对象，直接弹出下属性条
	//				如果点击的格子没有任何对象，将弹出主控制板。
	//范围选择中	移动或是使用/传递操作型道具（移动其实可以视为一种特殊的道具），并且已经确定了某个作用范围模板以后。
	//				这时候地图的格子滤镜会生效。鼠标移动到滤镜内，对应的实际作用对象会变为橙色，点击橙色将触发道具使用。
	//				如果点击其他地方，当前角色的参考位置将归位于真实位置，关闭所有UI条和滤镜。
	that.地图操作状态 = "不可操作";
	that.addEventListener("click", function(){
		//之所以在地图页面加这个而不是在入口点，还是为了利用地图内的属性轻松一点，直接写that
		switch(that.地图操作状态){
			case "不可操作":
				break;
			case "待操作":
				break;
			case "范围选择中":
				break;
		}
	});
}
var p = createjs.extend(地图纯容器,createjs.Container);
cls.地图纯容器 = createjs.promote(地图纯容器, "Container");

}());