# Gomoku
this is a Gomoku game's client and server, which bulid by canvas and swoole

这是一个使用HTML5 Canvas构建客户端，PHP Swoole构建服务端，使用服务端与客户端使用Websocket协议通信的五子棋小游戏
客户端依赖Amaze UI用于为游戏主界面提供具有响应式布局的栅格布局，DOM操作全部使用原生JS完成

服务端部分使用了Swoole扩展实现Websocket服务端的构建，存储部分使用的是PDO扩展与MySQL进行数据库交互。
数据库有4个表：
- users表引擎为MEMORY，用于存储当前已连接服务端的用户uid与状态（该uid用于网络对战时标识用户）
- users_log表引擎为InnoDB，用于持久化存储客户端与服务端的连接记录，方便进行各种统计信息。（使用触发器与users表同步）
- rooms表引擎为MEMORY，用于记录当前正在游戏中的房间，该表中维护两个user实体之间的关系，并且记录最后行棋者，步数（着数）等信息用于防止某个用户重复行棋。
- records表引擎为MEMORY，用于记录棋谱状态，防止用户在同一个坐标重复行棋，以及进行判赢算法（五子棋中判断棋盘上出现活五则该玩家获胜）统计赢家。如果需要持久化存储棋谱数据，用户可自行建表，然后使用触发器保持该表与棋谱表的同步。
注意：服务端Swoole扩展需要额外编译安装

服务端在Ubuntu 14 + PHP 5.6 + Swoole 1.8.6 + MySQL 5.5下测试通过
客户端在IE Edge，Chrome，Firefox等支持HTML5的主流浏览器下均可正常使用。
