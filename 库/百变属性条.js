//隐藏空间
(function(){
//属性条显示遥控器对象。
//在全局脚本创建两个遥控器，预备分别对应上面和下面的属性条。
//在帧内，等属性条初始化完成以后，通过绑定函数与属性条实例完成绑定。
//虽然是容器，但是和地图有所不同，地图是纯容器，完全通过代码控制。
//而这个容器里面只有一个实例，实际上还是以控制影片剪辑内元件的形式间接控制。
function 属性条UI容器(实例位置y){
	var that = this;
	that.Container_constructor();
	that.属性条实例 = new lib.元件百变属性条();
	that.属性条实例.setTransform(277.6,实例位置y,1,1,0,0,0,1,-1.5);
	that.addChild(that.属性条实例);

	that.模式字典表 = {
		基本控制板 : new 基本控制板抽象(that),
		装备控制板 : new 装备控制板抽象(that),
	};
	that.当前模式 = null;//当前模式指代模式对应的抽象对象

	//当前头像，表示当前正在显示的头像实例
	//当前连携头像，如果它为null，连携头像框会不显示。
	that.当前头像 = null;
	that.当前连携头像 = null;
	//参数填true或者false
	that.显示 = function(bool){
		that.属性条实例.visible = bool;
	}
	//此处填模式在模式字典表中的名字，也可以直接输入模式的抽象对象
	that.模式切换 = function(切换模式){
		if(that.当前模式 != null){
			that.当前模式.实例.visible = false;
		}
		if(typeof(切换模式) == "string"){
			that.当前模式 = that.模式字典表[切换模式];
		}
		else{
			that.当前模式 = 切换模式;
		}
		that.当前模式.实例.visible = true;
		//根据模式不同，内部显示的元件也不同。
	}
	//头像有两个参数，可以填头像与连携对象的实例名，也可以直接输入头像实例
	that.头像切换 = function(切换主头像, 切换连携头像){
		if(that.当前头像 != null){
			that.当前头像.visible = false;
		}
		if(that.当前连携头像 != null){
			that.当前连携头像.visible = false;
		}
		//首先是主头像的部分
		if(typeof(切换主头像) == "string"){
			var 主头像 = that.属性条实例[切换主头像];
			//eval("var 主头像 = that.属性条实例." + 切换主头像);
		}
		else
		{
			var 主头像 = 切换主头像;
		}
		主头像.visible = true;
		主头像.x = -182;
		主头像.y = 0;
		that.当前头像 = 主头像;
		//接下来是连携头像的部分，如果没有第二个参数，连携头像框不显示。
		if(arguments.length < 2){
			that.属性条实例.连携头像框.visible = false;
			that.属性条实例.连携头像白色遮挡.visible = false;
		}
		else{//有第二个参数，显示连携头像
			if(typeof(切换连携头像) == "string"){
				var 连携头像 = that.属性条实例[切换连携头像];
				//eval("var 连携头像 = that.属性条实例." + 切换连携头像);
			}
			else
			{
				var 连携头像 = 切换连携头像;
			}
			连携头像.visible = true;
			that.属性条实例.连携头像框.visible = true;
			that.属性条实例.连携头像白色遮挡.visible = true;
			连携头像.x = -182;
			连携头像.y = -100;
			that.当前连携头像 = 连携头像;
		}
	}
	//血量显示方法，通过输入当前HP和满血HP来显示
	that.血量显示 = function(HP, maxHP){
		let 血量百分比 = HP / maxHP;
		let 满血条x = 37.00;
		let 空血条x = -57;
		let 血条像素 = 满血条x - 空血条x;
		if(血量百分比 < 0){
			血量百分比 = 0;
		}
		else if(血量百分比 > 1){
			血量百分比 = 1;
		}
		that.属性条实例.血条.x = 空血条x + (血条像素 * 血量百分比 * 2);
		that.属性条实例.当前HP值.text = HP;
		that.属性条实例.最大HP值.text = maxHP;
	}
}
var p = createjs.extend(属性条UI容器,createjs.Container);
cls.属性条UI容器 = createjs.promote(属性条UI容器, "Container");

function 基本控制板抽象(所属属性条UI容器){
	var that = this;
	that.所属属性条UI容器 = 所属属性条UI容器;
	that.实例 = 所属属性条UI容器.属性条实例.基本控制板;
}

function 装备控制板抽象(所属属性条UI容器){
	var that = this;
	that.所属属性条UI容器 = 所属属性条UI容器;
	that.实例 = 所属属性条UI容器.属性条实例.装备控制板;
}


}());//隐藏空间结束