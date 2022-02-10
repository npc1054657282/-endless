var lib = AdobeAn.getComposition("F9F78158E30CFB41AA33C247B6224B53").getLibrary();
//注：由于这个js在实现的时候An相关内容还没有创建，因此An相关的全局对象只能等到进入游戏入口点再初始化。
var 全局 = {
    地图 : null,
    下属性条 : null,
    测试文本 : null,
    UI事件分发器 : new cls.纯含参事件分发器(),
    结算事件分发器 : new cls.纯含参事件分发器(),
    决策空间 : {
        //决策空间我放在全局而非地图的一个属性，这是在为跨地图的决策做后路。
        //如果未来设计跨地图决策的话，起始地图通过角色->所在格子->所在地图确定
        //目的地图通过目标格子->所在地图决定目的点地图。简单地说，决策的相关位置与格子绑定
        //通过格子的关系决定地图的关系，而与地图本身解耦
        角色 : undefined,
        移动通路列表 : undefined,
        //决策使用的道具用道具栏类型与道具栏位号来定位。
        //虽然每个道具有一个对应的对象，不过用这两个属性标识，
        //这样的话如果发生道具在使用后耐久损失而消失的情形，可以更方便地在结算中将道具从栏位里移除
        //（否则的话需要在道具对象里标识其所属栏位）
        道具栏类型 : undefined,
        道具栏位号 : undefined,
        //道具的目标总是以格子为单位来计算，因为一些道具会影响没有任何角色在其中的格子
        //虽然存在一个格子里有多个角色的情况，但这种情况下格子内的角色一定不会触发战斗
        //从设定上讲，角色的射击精度也只能确定到格子而无法确定到格子中的某一个角色，除了枪神能力
        //设定上有一种一个格子里有多个角色的，就是敌军的“军团体”能力，这个能力的角色内部有多个血条
        //每个内部血条可以支持其攻击一次。在游戏机制上依然认为这是一个角色，只是有特殊的结算方式而已。
        //攻击军团体角色时，对军武器道具可以同时攻击其每个血条。非对军武器道具只能随机攻击其中一个。
        //枪神能力使用非对军武器道具可以固定攻击军团体中余量最少的内部血条。
        目标格子列表 : [],
        //对于可被应对的道具，确定目标后将会对另一方发起操作请求。
        //在操作请求下，每个被目标格子覆盖的角色占据一个应对决策空间，
        //一般来讲只有目标为单格的道具可被应对，但是依然要为一些特例保留空间
        //应对决策空间有以下属性：
        //角色(类型为角色对象)、应对操作（字符串"迎击"、"回避"、"防御"）、道具栏类型、道具栏位号（后两项仅迎击时有效）
        应对决策空间列表 : [],
    }
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
    全局.地图.地图鼠标于舞台激活(stage);

    cls.角色.创建并导入地图(全局.地图, "哆啦A梦", "哆啦A梦");
    全局.结算事件分发器.添加监听("角色登场后", function(){
        全局.下属性条.visible = false;
        全局.地图.移动角色并播放动画("哆啦A梦", 全局.地图.二维格子数组[8][9]);
    })
    全局.地图.登场单个角色("哆啦A梦", 4, 4);

    全局.下属性条.血量显示(200, 1000);
    全局.下属性条.模式切换("基本控制板");
    全局.下属性条.头像切换("北诞老人头像", "黑化的大雄头像")
}