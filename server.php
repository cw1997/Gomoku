<?php
/**
 * @name 五子棋服务端
 * @author 昌维 [867597730@qq.com]
 * @website www.changwei.me
 * @date 2017-02-09 14:26:47
 * @complete 2017-02-11 00:47:24
 */
echo "author:changwei [www.changwei.me]\nEmail:867597730@qq.com\nstart at ".time()."\n";
/**
 * @DDL
 */
const DSN = 'mysql:host=192.168.19.97;dbname=gobang';
const USER = 'root';
const PASS = '';

const LISTEN_ADDR = '0.0.0.0';
const LISTEN_PORT = '1997';

const GET_UID = 1; // 获取用户UID
const CHALLENGE_OTHER = 2; // 发起对战
const TAKE_ON_CHALLENGE = 3; // 接受对战提示
const TAKE_ON_CHALLENGE_ACK = 4; // 同意接受对战
const TAKE_ON_CHALLENGE_RST = 5; // 拒绝接受对战
const START_GAME = 6; // 开始游戏
const REFUSE_GAME = 7; // 拒绝游戏（暂时废除）
const DOWNLOAD_SECOND = 8; // 读秒数据（常规比赛双方各10*60秒）
const GET_SCORE = 9; // 分数成绩时间等信息
const DOWNLOAD_PIECE_MOVES = 10; // 服务端发送落子状态
const UPLOAD_PIECE_MOVES = 11; // 客户端上报落子状态
const GET_SECOND = 12; // 客户端上报落子状态
const GET_PLAYER_LIST = 13; // 客户端请求玩家列表
const DOWNLOAD_PLAYER_LIST = 14; // 服务端下发玩家列表

const USER_FREE = 0;
const USER_BLACK = 1;
const USER_WHITE = 2;
const USER_ACK = 3;
const USER_RST = 4;

const grid_count = 15;

const PIECE_EMPTY = -1;
const PIECE_BLACK = 1;
const PIECE_WHITE = 0;

/**
 * 刷新读秒
 */
/*swoole_timer_tick(1000, function () {
	$pdo = new PDO(dsn, user, pass);
	$stmt = $pdo->prepare("UPDATE gobang_rooms SET black_seconds = black_seconds - 1 WHERE last_player = 0");
	$black = $stmt->exec();
	$stmt = $pdo->prepare("UPDATE gobang_rooms SET white_seconds = white_seconds - 1 WHERE last_player = 1");
	$white = $stmt->exec();
	echo "update:{$black}, {$white} \n";
});*/

function query($sql, $params) {
	$rs = [];
	$pdo = new PDO(DSN, USER, PASS);
	$stmt = $pdo->prepare($sql);
	if ( $stmt->execute($params) ) {
		while ( $row = $stmt->fetch() ) {
			$rs[] = $row;
		}
	}
	return $rs;
}
function update($sql, $params) {
	try {
		$pdo = new PDO(DSN, USER, PASS);
		$stmt = $pdo->prepare($sql);
		return $stmt->execute($params);
	} catch (Exception $e) {
		var_dump($e);
	}
}
/**
 * 判断是否活五
 * @param  [array] $rs [棋谱表结果集]
 * @return [array]     [含有winner和Position的数组]
 */
function checkWin($rs) {
	// mysql> SELECT * FROM `gobang_records`;
	// +----+---------+---+----+---------+-----+-------+-------------+
	// | id | room_id | x | y  | isblack | uid | index | record_time |
	// +----+---------+---+----+---------+-----+-------+-------------+
	// |  1 |       1 | A | 15 |       1 |   2 |     1 |  1486742597 |
	// |  2 |       1 | A | 14 |       0 |   1 |     2 |  1486742599 |
	// |  3 |       1 | B | 15 |       1 |   2 |     3 |  1486742600 |
	// |  4 |       1 | B | 14 |       0 |   1 |     4 |  1486742601 |
	// |  5 |       1 | C | 15 |       1 |   2 |     5 |  1486742606 |
	// |  6 |       1 | C | 14 |       0 |   1 |     6 |  1486742607 |
	// |  7 |       1 | D | 15 |       1 |   2 |     7 |  1486742608 |
	// |  8 |       1 | D | 14 |       0 |   1 |     8 |  1486742609 |
	// |  9 |       1 | E | 15 |       1 |   2 |     9 |  1486742610 |
	// +----+---------+---+----+---------+-----+-------+-------------+
	// 9 rows in set
	// var_dump($rs);
	// 此处注意y轴起始位置为1
	for ($x = 0; $x < grid_count; $x++) {
		for ($y = 1; $y < grid_count + 1; $y++) {
			$board[$x][$y - 1] = PIECE_EMPTY;
		}
	}
	foreach ($rs as $key => $value) {
		$board[ord($value['x']) - 65][$value['y'] - 1] = $value['isblack'];
		// echo $value['x']." ".(ord($value['x']) - 65).'<br>';
	}
	// var_dump($board);
	/*for ($y = grid_count - 1; $y >= 0; $y--) {
		for ($x = 0; $x < grid_count; $x++) {
			$v = $board[$x][$y];
			if ($v == 1) {
				echo "● ";
			} elseif ($v == 0) {
				echo "○ ";
			} else {
				echo "□ ";
			}
		}
		echo PHP_SAPI == 'cli' ? "\n" : "<br>";
	}*/
	$row = 0; # -
	$col = 0;# |
	$backslash = 0; # \
	$slash = 0; # /
	for ($x = 0; $x < grid_count; $x++) {
		for ($y = 0; $y < grid_count; $y++) {
			# -
			if ( $y <= 10 && $board[$x][$y] != PIECE_EMPTY &&
			$board[$x][$y] == $board[$x][$y + 1] &&
			$board[$x][$y] == $board[$x][$y + 2] &&
			$board[$x][$y] == $board[$x][$y + 3] &&
			$board[$x][$y] == $board[$x][$y + 4] ) {
				$result['winner'] = $board[$x][$y] == PIECE_BLACK ? 'black' : 'white';
				$result['position'][0]['x'] = $x;
				$result['position'][0]['y'] = $y;
				$result['position'][1]['x'] = $x;
				$result['position'][1]['y'] = $y + 1;
				$result['position'][2]['x'] = $x;
				$result['position'][2]['y'] = $y + 2;
				$result['position'][3]['x'] = $x;
				$result['position'][3]['y'] = $y + 3;
				$result['position'][4]['x'] = $x;
				$result['position'][4]['y'] = $y + 4;
				return $result;
			}
			# |
			if ( $x <= 10 && $board[$x][$y] != PIECE_EMPTY &&
			$board[$x][$y] == $board[$x + 1][$y] &&
			$board[$x][$y] == $board[$x + 2][$y] &&
			$board[$x][$y] == $board[$x + 3][$y] &&
			$board[$x][$y] == $board[$x + 4][$y] ) {
				$result['winner'] = $board[$x][$y] == PIECE_BLACK ? 'black' : 'white';
				$result['position'][0]['x'] = $x;
				$result['position'][0]['y'] = $y;
				$result['position'][1]['x'] = $x + 1;
				$result['position'][1]['y'] = $y;
				$result['position'][2]['x'] = $x + 2;
				$result['position'][2]['y'] = $y;
				$result['position'][3]['x'] = $x + 3;
				$result['position'][3]['y'] = $y;
				$result['position'][4]['x'] = $x + 4;
				$result['position'][4]['y'] = $y;
				return $result;
			}
			# \
			if ( $x <= 10 && $y >= 4 && $board[$x][$y] != PIECE_EMPTY &&
			$board[$x][$y] == $board[$x + 1][$y - 1] &&
			$board[$x][$y] == $board[$x + 2][$y - 2] &&
			$board[$x][$y] == $board[$x + 3][$y - 3] &&
			$board[$x][$y] == $board[$x + 4][$y - 4] ) {
				$result['winner'] = $board[$x][$y] == PIECE_BLACK ? 'black' : 'white';
				$result['position'][0]['x'] = $x;
				$result['position'][0]['y'] = $y;
				$result['position'][1]['x'] = $x + 1;
				$result['position'][1]['y'] = $y - 1;
				$result['position'][2]['x'] = $x + 2;
				$result['position'][2]['y'] = $y - 2;
				$result['position'][3]['x'] = $x + 3;
				$result['position'][3]['y'] = $y - 3;
				$result['position'][4]['x'] = $x + 4;
				$result['position'][4]['y'] = $y - 4;
				return $result;
			}
			# /
			if ( $x <= 10 && $y <= 10 && $board[$x][$y] != PIECE_EMPTY &&
			$board[$x][$y] == $board[$x + 1][$y + 1] &&
			$board[$x][$y] == $board[$x + 2][$y + 2] &&
			$board[$x][$y] == $board[$x + 3][$y + 3] &&
			$board[$x][$y] == $board[$x + 4][$y + 4] ) {
				$result['winner'] = $board[$x][$y] == PIECE_BLACK ? 'black' : 'white';
				$result['position'][0]['x'] = $x;
				$result['position'][0]['y'] = $y;
				$result['position'][1]['x'] = $x + 1;
				$result['position'][1]['y'] = $y + 1;
				$result['position'][2]['x'] = $x + 2;
				$result['position'][2]['y'] = $y + 2;
				$result['position'][3]['x'] = $x + 3;
				$result['position'][3]['y'] = $y + 3;
				$result['position'][4]['x'] = $x + 4;
				$result['position'][4]['y'] = $y + 4;
				return $result;
			}
		}
	}
}

/**
 * 创建websocket服务端
 * @var swoole_websocket_server
 */
$server = new swoole_websocket_server(LISTEN_ADDR, LISTEN_PORT);
//var_dump($server);

$server->on('open', function (swoole_websocket_server $server, $request) {
	echo "server: handshake success with fd{$request->fd}\n";//$request->fd 是客户端id
	// var_dump($server);
	var_dump($request->server);
	if ( update("INSERT INTO `gobang_users` (`id`,`status`,`remote_addr`,`remote_port`,`request_time`) VALUES (?,0,?,?,?)", [ $request->fd, $request->server['remote_addr'], $request->server['remote_port'], $request->server['request_time'] ]) ) {
	// if ( update("INSERT INTO `gobang_users` (`id`,`status`) VALUES (?,0)", [ $request->fd ]) ) {
		$send_data['type'] = GET_UID;
		$send_data['data']['uid'] = $request->fd;
		$server->push($request->fd, json_encode($send_data));
	} else {
		$server->close($request->fd);
	}
});

$server->on('message', function (swoole_websocket_server $server, $frame) {
	echo "receive from {$frame->fd}:{$frame->data},opcode:{$frame->opcode},fin:{$frame->finish}\n";
	//$frame->fd 是客户端id，$frame->data是客户端发送的数据
	//服务端向客户端发送数据是用 $server->push( '客户端id' ,  '内容')
	$data = $frame->data;
	$fd = $frame->fd;
	// var_dump($data);
	$data = json_decode($data, 1);
	switch ($data['type']) {
		case GET_UID:
			# code...
			break;
		case CHALLENGE_OTHER:
			$rs_user = query("SELECT * FROM `gobang_users` WHERE `id`=?", [ $fd ]);
			if ( $rs_user[0]['status'] == USER_FREE ) {
				// 改变自身状态为ACK
				if ( update("UPDATE `gobang_users` SET `status`=3 WHERE id=?", [ $fd ]) ) {+
					// 向挑战目标下发战书，内容为发起者uid
					$send_data['type'] = TAKE_ON_CHALLENGE;
					$send_data['data']['challenger_uid'] = $fd;
					$server->push($data['data']['uid'], json_encode($send_data));
				}
			}
			break;
		case TAKE_ON_CHALLENGE:
			# code...
			break;
		case TAKE_ON_CHALLENGE_ACK:
			// 对方同意接受挑战
			$rs_user_me = query("SELECT * FROM `gobang_users` WHERE `id`=?", [ $fd ]);
			$rs_user_target = query("SELECT * FROM `gobang_users` WHERE `id`=?", [ $data['data']['target_uid'] ]);
			if ( $rs_user_me[0]['status'] == USER_FREE ) {
				// 随机进行分配先后手
				$me = rand(USER_BLACK, USER_WHITE);
				$target = ($me == USER_BLACK ? USER_WHITE : USER_BLACK);
				update("UPDATE `gobang_users` SET `status`=? WHERE id=?", [ $me, $fd ]);
				update("UPDATE `gobang_users` SET `status`=? WHERE id=?", [ $target, $data['data']['target_uid'] ]);
				// 下发开始游戏信号
				$send_data['type'] = START_GAME;
				$send_data['data']['black_uid'] = $black_uid = ($me == USER_BLACK ? $fd : $data['data']['target_uid']);
				$send_data['data']['white_uid'] = $white_uid = ($me != USER_BLACK ? $fd : $data['data']['target_uid']);
				$send_data['data']['black_ip'] = $black_ip = ($me == USER_BLACK ? $rs_user_me[0]['remote_addr'] . ':' . $rs_user_me[0]['remote_port'] : $rs_user_target[0]['remote_addr'] . ':' . $rs_user_target[0]['remote_port']);
				$send_data['data']['white_ip'] = $white_ip = ($me != USER_BLACK ? $rs_user_me[0]['remote_addr'] . ':' . $rs_user_me[0]['remote_port'] : $rs_user_target[0]['remote_addr'] . ':' . $rs_user_target[0]['remote_port']);
				$server->push($data['data']['target_uid'], json_encode($send_data));
				$server->push($fd, json_encode($send_data));
				update("INSERT INTO `gobang_rooms` (`black_uid`,`black_seconds`,`white_uid`,`white_seconds`,`last_player`,`create_time`) VALUES (?,?,?,?,?,?)", [ $black_uid, 600, $white_uid, 600, USER_WHITE, time() ]);
			}
			break;
		case TAKE_ON_CHALLENGE_RST:
			$rs_user = query("SELECT * FROM `gobang_users` WHERE `id`=?", [ $fd ]);
			if ( $rs_user[0]['status'] == USER_FREE or $rs_user[0]['status'] == USER_RST ) {
				// 改变自身状态为FREE
				if ( update("UPDATE `gobang_users` SET `status`=0 WHERE id=? OR id=?", [ $fd, $data['data']['target_uid'] ]) ) {
					$send_data['type'] = TAKE_ON_CHALLENGE_RST;
					$send_data['data']['target_uid'] = $fd;
					$server->push($data['data']['target_uid'], json_encode($send_data));
				}
			}
			break;
		case START_GAME:
			# code...
			break;
		case REFUSE_GAME:
			# code...
			break;
		case DOWNLOAD_SECOND:
			# code...
			break;
		case GET_SCORE:
			# code...
			break;
		case DOWNLOAD_PIECE_MOVES:
			# code...
			break;
		case UPLOAD_PIECE_MOVES:
			/**
			 * 客户端上报格式
			 * {x:char2ascii(chesspiece_position_x), y:grid_count - chesspiece_position_y}
			 */
			$rs_user = query("SELECT * FROM `gobang_users` WHERE `id`=?", [ $fd ]);
			$rs_room = query("SELECT * FROM `gobang_rooms` WHERE `black_uid`=? OR `white_uid`=? ORDER BY `create_time` DESC", [ $fd, $fd ]);
			$rs_record = query("SELECT * FROM `gobang_records` WHERE `room_id`=? ORDER BY `id` DESC LIMIT 1", [ $rs_room[0]['id'] ]);
			// 判断本轮由谁执棋，防止客户端作弊
			// $should = $rs_record[0]['isblack'] == 1 ? USER_WHITE : USER_BLACK;
			$should = ($rs_room[0]['last_player'] == USER_BLACK ? USER_WHITE : USER_BLACK);
			if ( $rs_user[0]['status'] == $should ) {
				// 判断是否重复落子
				if ( query("SELECT count(`id`) AS `c` FROM `gobang_records` WHERE `room_id`=? AND `x`=? AND `y`=?", [ $rs_room[0]['id'], $data['data']['x'], $data['data']['y'] ])[0]['c'] == 0 ) {
					// $rs_room = $rs_user[0]['status'] == 1 ? query("SELECT * FROM `gobang_rooms` WHERE `black_uid`=?", [ $fd ]) : query("SELECT * FROM `gobang_rooms` WHERE `white_uid`=?", [ $fd ]);
					$rec_prarms[] = $rs_room[0]['id']; // room_id
					$rec_prarms[] = $data['data']['x']; // x
					$rec_prarms[] = $data['data']['y']; // y
					$rec_prarms[] = $rs_user[0]['status'] == USER_BLACK ? 1 : 0; // isblack
					$rec_prarms[] = $rs_user[0]['id']; // uid
					$rec_prarms[] = count($rs_record) == 0 ? 1 : $rs_record[0]['index'] + 1; // index
					$rec_prarms[] = time(); // record_time
					$rs_record_update = update("INSERT INTO `gobang_records` (`room_id`,`x`,`y`,`isblack`,`uid`,`index`,`record_time`) VALUES (?,?,?,?,?,?,?)", $rec_prarms);
					$rs_room_update = update("UPDATE `gobang_rooms` SET `last_player`=? WHERE `id`=?", [ $rs_room[0]['last_player'] == USER_BLACK ? USER_WHITE : USER_BLACK, $rs_room[0]['id'] ]);
					// 下发落子数据
					$send_data['type'] = DOWNLOAD_PIECE_MOVES;
					$send_data['data']['x'] = $data['data']['x']; // x
					$send_data['data']['y'] = $data['data']['y']; // y
					$send_data['data']['isBlack'] = $rs_user[0]['status'] == 1 ? 1 : 0; // isblack
					$send_data['data']['index'] = count($rs_record) == 0 ? 1 : $rs_record[0]['index'] + 1; // index
					// 根据房间号找到双方uid并且下发数据
					$server->push($rs_room[0]['black_uid'], json_encode($send_data));
					$server->push($rs_room[0]['white_uid'], json_encode($send_data));
					// 判断某一方是否已经构成活五赢得比赛，如果真则下发GET_SCORE数据（为提升效率，可以将落子数据做在redis内，定时同步至MySQL，目前学习版本全用MySQL足够）
					$game_result = checkWin(query("SELECT * FROM `gobang_records` WHERE `room_id`=?", [ $rs_room[0]['id'] ]));
					if ( $game_result != false ) {
						// GET_SCORE
						// 下发result
						$send_data['type'] = GET_SCORE;
						$send_data['data'] = $game_result;
						// 根据房间号找到双方uid并且下发数据
						$server->push($rs_room[0]['black_uid'], json_encode($send_data));
						$server->push($rs_room[0]['white_uid'], json_encode($send_data));
						$rs_user_update = update("UPDATE `gobang_users` SET `status`=0 WHERE `id`=? OR `id`=?", [ $rs_room[0]['black_uid'], $rs_room[0]['white_uid'] ]);
					}
				}
			}
			break;
		case GET_SECOND:
			if ( query("SELECT * FROM `gobang_rooms` WHERE `black_uid`=? OR `white_uid`=?", [ $fd,$fd ]) ) {
				$send_data['type'] = DOWNLOAD_SECOND;
				$send_data['data']['black_second'] = $rs[0]['black_second'];
				$send_data['data']['white_second'] = $rs[0]['white_second'];
				$server->push($fd, json_encode($send_data));
			}
			break;
		case GET_PLAYER_LIST:
			if ( $rs = query("SELECT * FROM `gobang_users` WHERE `status`=0", [ ]) ) {
				$send_data['type'] = DOWNLOAD_PLAYER_LIST;
				// 防止泄漏IP端口
				foreach ($rs as $key => $value) {
					unset($rs[$key]['remote_addr']);
					unset($rs[$key]['remote_port']);
				}
				$send_data['data']['list'] = $rs;
				$server->push($fd, json_encode($send_data));
			}
			break;
		case DOWNLOAD_PLAYER_LIST:
			break;

		default:
			# code...
			break;
	}

});

$server->on('close', function ($ser, $fd) {
	update("DELETE FROM `gobang_users` WHERE `id`=?", [ $fd ]);
	echo "client {$fd} closed\n";
});

$server->start();

/*$serv = new swoole_websocket_server("0.0.0.0", 1997);

$serv->on('Open', function($server, $req) {
	echo "connection open: ".$req->fd;
});

$serv->on('Message', function($server, $frame) {
	echo time()." receive message: ".$frame->data."\n";
	// $server->push($frame->fd,$frame->data);
/*    foreach ($server->connection as $fd) {
		if ($frame->fd!=$fd) {
			$server->send($fd,$frame->data);
		}
	}
});

$serv->on('Close', function($server, $fd) {
	echo "$fd connection close: ".$fd;
});

$serv->start();*/

/*$serv = new swoole_server("0.0.0.0", 1234);
$serv->on('connect', function ($serv, $fd){
	echo "Client:Connect.\n";
});
$serv->on('receive', function ($serv, $fd, $from_id, $data) {
	$serv->send($fd, 'Swoole: '.$data);
	$serv->close($fd);
});
$serv->on('close', function ($serv, $fd) {
	echo "Client: Close.\n";
});
$serv->start();*/
/*$serv = new swoole_http_server("127.0.0.1", 9502);

$serv->on('Request', function($request, $response) {
	var_dump($request->get);
	var_dump($request->post);
	var_dump($request->cookie);
	var_dump($request->files);
	var_dump($request->header);
	var_dump($request->server);

	$response->cookie("User", "Swoole");
	$response->header("X-Server", "Swoole");
	$response->end("<h1>Hello Swoole!</h1>");
});

$serv->start();*/
?>