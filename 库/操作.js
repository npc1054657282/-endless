//战斗预测的边界在哪里，这是一个问题。
//铁人兵团的战斗预测，会显示备给道具对命中的加成，会显示防御对威力的减成，闪避对命中的减成
//也会显示由于某些原因角色提前进入的不可反击状态等。
//但是不会显示司令的I-FIELD能力对威力的减成
//因此可以将战斗的相关状态分为两类，一类是可预测状态，一类是不可预测状态。
//一般备给道具、装备道具提供的状态是可预测的，而地图场景、角色能力等提供的状态是不可预测的。
//另外，要注意到角色的状态在编码方式上也分为两类，有些状态是硬编码在代码中，通过判定状态决定执行逻辑
//而另一部分状态则是在某些事件分发后被触发执行，这些插入结算并不能直接影响执行逻辑整体
//后面这类可扩展状态可以通过修改角色的硬编码状态或是其他数值来间接影响执行逻辑。



//出于对人和AI的统一化处理，在操作上设置一组API
//为什么要设置这么一些API，因为玩家在操作的时候，会显示一些与这些操作相关的UI内容
//如果认为这些UI内容与操作本身有关，那是不合理的，因为交给AI操作的时候，并不需要显示这些内容。
//因此需要将这些UI动画与实际真正与操作结算相关的内容与动画剥离开来。
//玩家通过一些UI接口执行操作API，AI则是根据其逻辑自动执行操作API，这些操作会直接进行结算。
//而结算结果反过来指导UI进行相应的动画展示。对于玩家侧，UI端根据操作API的返回值提供相应的接口供玩家做下一步操作
//对于AI侧，则会根据API的返回值指导AI下一步做什么行动
//每个地图设置一个决策域，决策域内记录该地图当前正在决策中的角色、使用道具、选择目标等信息
//因此对于玩家需要循序渐进地进行某个完整操作时，对应的操作API会一点点地填充决策域。
//最后再通过决定操作将之前的决策操作正式启用。
//有这些操作：
//决策选定角色
//决策选定场景
//决策使用道具
//决策移动
//决策传递道具
//决策选定目标
//决策应对
//确认决策
//撤销决策
//使用备给道具
//装备道具  
//      检查目标装备栏是否已有装备，若已有，将原道具uid其移出装备栏，触发该道具的卸载效果。
//      将待处置道具栏内的道具uid放入目标装备栏，触发此道具的装备效果。
//      将被卸载的道具uid（如果有的话）放入待处置道具栏。
//卸载道具
//      将道具移出其所在装备栏，触发此道具的卸载效果。将此道具放入待处置道具栏。
//丢弃备给道具
//替换备给道具

//关于道具
//道具的效果有三类。使用效果、装备效果、卸载效果。
//其中，装备效果和卸载效果实际上对应的是道具的被动效果，只是实现成了装备时获得状态，卸载时失去状态。
//此外，装备效果还包括添加一些与装备有关的监听，比如一些耐久度下降事件。
//使用效果和另外两种效果的限制不同，底线不同。
//主动使用的道具的限制很宽松，但是在其引发的结算链中，依然是严禁发生“另一道具被使用”这种行为的。
//尽管这里本想对这些结算做一些系统上的限制，但实在是有心无力
//作为取代，将权限码和权限标签等内容进行了一番优化，不再依赖链式插入结算
//此外，作为一套规范，很多检测结算规定在“新回合开始”时执行一次，这也符合游戏里实际的一回合时间
//举个例子，当你卸载竹蜻蜓时，你应该失去了浮空能力，这时候如果你在一个只有浮空才能落脚的格子，就会产生冲突
//但本回合不会对此进行结算，只有当你结束本回合时，才会进行合法检查，并进行冲突结算。