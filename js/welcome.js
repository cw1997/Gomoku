var board;
var chesspiece;
var chesspiece_hover;
var ws_uri;

var game_status = false;

board = document.getElementById("board").getContext("2d");
chesspiece = document.getElementById("chesspiece").getContext("2d");
chesspiece_hover = document.getElementById("chesspiece_hover").getContext("2d");

document.getElementById('start_game').addEventListener('click', function() {
/*	ip_port = prompt('请输入服务端IP和端口，格式为“IP:port”，例如127.0.0.1:1997');
	re = /^(\d|[1-9]\d|1\d{2}|2[0-5][0-5])\.(\d|[1-9]\d|1\d{2}|2[0-5][0-5])\.(\d|[1-9]\d|1\d{2}|2[0-5][0-5])\.(\d|[1-9]\d|1\d{2}|2[0-5][0-5]):([0-9]|[1-9]\d{1,3}|[1-5]\d{4}|6[0-5]{2}[0-3][0-5])$/;
	if (re.test(ip_port)) {
		ws_uri = 'ws://' + ip_port;
		connect(ws_uri);
		document.getElementById('welcome').style.display = 'none';
	} else {
		alert('请输入一个正确的服务端IP&端口');
	}*/
	connect('ws://192.168.1.5:1997');
	document.getElementById('welcome').style.display = 'none';
	// document.getElementById('board-warp').style.display = 'block';
	document.getElementById('main-warp').style.display = 'block';
	drawBoard(board);
}, false);

document.getElementById('challenge_other').addEventListener('click', function() {
	target_uid = prompt('请输入你要挑战的目标uid');
	if ( isNaN(target_uid) ) {
		alert('请输入一个正确的uid');
		return false;
	}
	doSend(buildJson(CHALLENGE_OTHER, {uid:target_uid}));
}, false);

