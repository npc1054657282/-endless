var lib = AdobeAn.getComposition("F9F78158E30CFB41AA33C247B6224B53").getLibrary();
//注：由于这个js在实现的时候An相关内容还没有创建，因此An相关的全局对象只能等到进入游戏入口点再初始化。
//没错，即使是角色控制器的创建，也用到了An里的内容
var 全局 = {
    地图 : null,
    下属性条 : null,
    角色 : new cls.角色集控制器(),
    测试文本 : null
};

function 游戏入口点(){
    全局.地图 = new cls.地图纯容器();
    全局.地图.setTransform(265.5,196,1,1,0,0,0,246.5,188);
    stage.addChild(全局.地图);
    全局.下属性条 = new cls.属性条UI容器(330.6);
    stage.addChild(全局.下属性条);
    全局.测试文本 = new createjs.Text("", "18px 'MS UI Gothic'");
    全局.测试文本.lineHeight = 20;
    全局.测试文本.lineWidth = 152;
	全局.测试文本.setTransform(215,121.6);
    stage.addChild(全局.测试文本);

    全局.角色.创建并导入地图(全局.地图, "哆啦A梦", 4, 4, "哆啦A梦");
    全局.地图.登场单个角色("哆啦A梦");

    全局.下属性条.血量显示(200, 1000);
    全局.下属性条.模式切换("基本控制板");
    全局.下属性条.头像切换("北诞老人头像", "黑化的大雄头像")
    createjs.Ticker.addEventListener("tick", function(){
        全局.地图.鼠标像素点 = 全局.地图.globalToLocal(stage.mouseX, stage.mouseY);
        let 鼠标所在格 = 全局.地图.获取像素点所在格(全局.地图.鼠标像素点);
        if(鼠标所在格){
            全局.地图.当前所选格 = 鼠标所在格;
        }
        全局.测试文本.text = 全局.地图.当前所选格.位置x + "\n" + 全局.地图.当前所选格.位置y;
    });
}