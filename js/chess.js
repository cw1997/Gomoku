const board_color = "black";
const board_line_width = 4;
const board_width = 670;
const board_height = 670;
const board_margin_left = board_line_width - board_line_width / 2; //外边距为board_width - board_line_width / 2
const board_margin_top = board_line_width - board_line_width / 2;
const board_padding_left = 60;
const board_padding_top = 40;
const board_circle_radius = 5;
const board_circle_color = "black";

const grid_color = "black";
const grid_width = 2;
const grid_offset = 40;
const grid_count = 15;
const grid_font = "bolder 20px Arial";

const x_text_padding_left = -40;
const x_text_padding_top = 5;
const y_text_padding_left = -5;
const y_text_padding_top = 0;

const chesspiece_hover_color = "red";

const chesspiece_radius = 15;
const chesspiece_color_black = "black";
const chesspiece_color_white = "white";
const chesspiece_text_margin_left = 0;
const chesspiece_text_margin_top = 5;
const chesspiece_text_font = "normal small-caps bolder 14px arial";
const chesspiece_text_align = "center";

const winner_line_color = "red";

var chesspiece_index = 1;
var chesspiece_state = [];

// 数字坐标以左上角（A15）为[0,0]，右下角（O1）为[14,14]
const chesspiece_none = 0;
const chesspiece_black = 1;
const chesspiece_white = 2;

initiateChesspieceState();

// getPosition("A", 15);
// numPos2xyPos(1, 15);
// setChesspiece(chesspiece, "A", 15, true, "15");
// setChesspiece(chesspiece, "A", 14, false, "5");

/**
 * 初始化棋盘为无落子状态
 * @return {[type]} [description]
 */
function initiateChesspieceState() {
	chesspiece.clearRect(board_margin_left, board_margin_top, board_width, board_height);
	for (var x = 0; x < 15; x++) {
		chesspiece_state[x] = [];
		for (var y = 0; y < 15; y++) {
			chesspiece_state[x][y] = chesspiece_none;
		}
	}
}

function ascii2char (char) {
	return String.fromCharCode(char + 65);
}
function char2ascii (ascii) {
	return ascii.charCodeAt() - 65;
}
/**
 * 数字坐标转棋盘坐标
 * @param  {[int]} num_x [description]
 * @param  {[int]} num_y [description]
 * @return {[object]}       [description]
 */
function numPos2xyPos(num_x, num_y) {
	return {x:char2ascii(num_x), y:num_y}
}
/**
 * 棋盘坐标转数字坐标
 * @param  {[string]} x [字母形式的坐标] A
 * @param  {[int]} y [数字坐标] 15
 * @return {[object]}   [包含xy的对象] {x:pos_x, y:pos_y}
 */
function getPosition(x, y) {
	x_str = x;
	x = char2ascii(x);
	// console.log(x);
	pos_x = board_padding_left + x * grid_offset;
	pos_y = board_padding_top + (grid_count - y) * grid_offset;
	// console.info(chesspiece_index, x_str + y, "x:" + pos_x, "y:" + pos_y);
	return {x:pos_x, y:pos_y};
}

function setChesspiece(x ,y, isBlack, index) {
	// 获取落子实际坐标
	position = getPosition(x ,y);
	// 棋子绘制
	chesspiece.beginPath();
	chesspiece.arc(position.x, position.y, chesspiece_radius, 0, 2 * Math.PI);
	chesspiece.fillStyle = isBlack ? chesspiece_color_black : chesspiece_color_white;
	chesspiece.stroke();
	chesspiece.fill();
	// 落子顺序文字绘制
	chesspiece.fillStyle = !isBlack ? chesspiece_color_black : chesspiece_color_white;
	chesspiece.font = chesspiece_text_font;
	chesspiece.textAlign = chesspiece_text_align;
	chesspiece.fillText(index, position.x + chesspiece_text_margin_left, position.y + chesspiece_text_margin_top);
}

function overChesspiece(chesspiece_hover, x ,y) {
	// 获取落子实际坐标
	position = getPosition(x ,y);
	// position = {x:x, y:y};
	// 空心框准心绘制
	// chesspiece_hover.beginPath();
	// chesspiece_hover.moveTo(position.x, position.y);
	// chesspiece_hover.lineTo(0,0);
	// chesspiece_hover.stroke();
	chesspiece_hover.fillStyle = "white";
	// chesspiece_hover.fillRect(board_margin_left, board_margin_top, board_width, board_height);
	chesspiece_hover.clearRect(board_margin_left, board_margin_top, board_width, board_height);
	chesspiece_hover.strokeStyle = chesspiece_hover_color;
	chesspiece_hover.strokeRect(position.x - grid_offset / 2, position.y - grid_offset / 2, grid_offset, grid_offset);
	/*// 落子顺序文字绘制
	chesspiece_hover.fillStyle = !isBlack ? chesspiece_color_black : chesspiece_color_white;
	chesspiece_hover.font = chesspiece_text_font;
	chesspiece_hover.textAlign = chesspiece_text_align;
	chesspiece_hover.fillText(index, position.x + chesspiece_text_margin_left, position.y + chesspiece_text_margin_top);*/
}

function setCircle(board, x ,y) {
	position = getPosition(x ,y);
	board.beginPath();
	board.arc(position.x, position.y, board_circle_radius, 0, 2 * Math.PI);
	board.fillStyle = board_circle_color;
	board.stroke();
	board.fill();
}

function clickBoard(evt) {
	if (game_status === false) return false;
	// 处理event对象兼容性 并且获取鼠标点击坐标 以xy变量返回
    var e = event || window.event;
    /*var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    var x = e.pageX || e.clientX + scrollX;
    var y = e.pageY || e.clientY + scrollY;*/
    // 这里要获取的是鼠标相对于canvas这个容器的距离
    var x = event.offsetX;
    var y = event.offsetY;
    // console.info('x: ' + x + '\ny: ' + y);
    // return { 'x': x, 'y': y };
    // 相对棋盘的xy坐标
    relative_x = x - board_padding_left;
    relative_y = y - board_padding_top;
    console.info('relative_x: ' + relative_x + ',relative_y: ' + relative_y);
	var chesspiece = document.getElementById("chesspiece").getContext("2d");
	chesspiece_position_x = Math.floor((relative_x + grid_offset / 2) / grid_offset);
	chesspiece_position_y = Math.floor((relative_y + grid_offset / 2) / grid_offset);
	// 超范围检测
	if (chesspiece_position_x < 0 || chesspiece_position_x > 14 || chesspiece_position_y < 0 || chesspiece_position_y > 14) {
		console.error(chesspiece_position_x, chesspiece_position_y, "在棋盘外落子视为无效");
		return false;
	}
	// 重复落子检测
	isBlack = true;
	if (chesspiece_state[chesspiece_position_x][chesspiece_position_y] != chesspiece_none) {
		console.error(chesspiece_position_x, chesspiece_position_y, "已有落子，落子颜色为", chesspiece_state[chesspiece_position_x][chesspiece_position_y]);
		return false;
	}
	// 落子操作写入棋盘状态
	chesspiece_state[chesspiece_position_x][chesspiece_position_y] = isBlack ? chesspiece_black : chesspiece_white;
	// 落子操作绘制棋子
    // setChesspiece(chesspiece, ascii2char(chesspiece_position_x), grid_count - chesspiece_position_y, isBlack, chesspiece_index++);
    doSend(buildJson(UPLOAD_PIECE_MOVES, {x:ascii2char(chesspiece_position_x), y:grid_count - chesspiece_position_y}));
	// console.log(String.fromCharCode(chesspiece_position_x + 65), grid_count - chesspiece_position_y);
}

function mouseoverBoard(evt) {
	// 处理event对象兼容性 并且获取鼠标点击坐标 以xy变量返回
    var e = event || window.event;
    /*var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
    var x = e.pageX || e.clientX + scrollX;
    var y = e.pageY || e.clientY + scrollY;*/
    // 这里要获取的是鼠标相对于canvas这个容器的距离
    var x = event.offsetX;
    var y = event.offsetY;
    // console.info('x: ' + x + '\ny: ' + y);
    // return { 'x': x, 'y': y };
    // 相对棋盘的xy坐标
    relative_x = x - board_padding_left;
    relative_y = y - board_padding_top;
    // console.info('relative_x: ' + relative_x + ',relative_y: ' + relative_y);
	var chesspiece_hover = document.getElementById("chesspiece_hover").getContext("2d");
	chesspiece_position_x = Math.floor((relative_x + grid_offset / 2) / grid_offset);
	chesspiece_position_y = Math.floor((relative_y + grid_offset / 2) / grid_offset);
	// 超范围检测
	if (chesspiece_position_x < 0 || chesspiece_position_x > 14 || chesspiece_position_y < 0 || chesspiece_position_y > 14) {
		// console.error(chesspiece_position_x, chesspiece_position_y, "在棋盘外落子视为无效");
		return false;
	}
	/*// 重复落子检测
	isBlack = true;
	if (chesspiece_state[chesspiece_position_x][chesspiece_position_y] != chesspiece_none) {
		console.error(chesspiece_position_x, chesspiece_position_y, "已有落子，落子颜色为", chesspiece_state[chesspiece_position_x][chesspiece_position_y]);
		return false;
	}*/
	/*// 落子操作写入棋盘状态
	chesspiece_state[chesspiece_position_x][chesspiece_position_y] = isBlack ? chesspiece_black : chesspiece_white;*/
	// 落子操作绘制棋子
    overChesspiece(chesspiece_hover, ascii2char(chesspiece_position_x), grid_count - chesspiece_position_y);
	// console.log(String.fromCharCode(chesspiece_position_x + 65), grid_count - chesspiece_position_y);
}

function drawBoard(board) {
	// 绘制棋盘底板边框
	board.strokeStyle = board_color;
	board.lineWidth = board_line_width;
	board.strokeRect(board_margin_left, board_margin_top, board_width, board_height);
	// 绘制网格线
	board.lineWidth = grid_width;
	board.font = grid_font;
	// 先画y轴再画x轴
	for (var x = 0; x < grid_count; x++) {
		for (var y = 0; y < grid_count; y++) {
			board.fillText(grid_count - y, board_padding_left + x_text_padding_left, board_padding_top + y * grid_offset + x_text_padding_top);
			board.beginPath();
			board.moveTo(board_padding_left, board_padding_top + y * grid_offset);
			board.lineTo(board_padding_left + (grid_count - 1) * grid_offset, board_padding_top + y * grid_offset);
			// console.info(x, y, board_padding_left + (grid_count - 1) * grid_offset, board_padding_top + y * grid_offset);
			board.stroke();
			// board.strokeRect(board_padding_left + x * grid_width,board_padding_top + y * grid_width,grid_width,grid_width);
		}
		board.fillText(ascii2char(x), board_padding_left + x * grid_offset + y_text_padding_left, board_padding_top + y * grid_offset + y_text_padding_top);
		board.beginPath();
		board.moveTo(board_padding_left + x * grid_offset, board_padding_top);
		board.lineTo(board_padding_left + x * grid_offset, board_padding_top + (grid_count - 1) * grid_offset);
		// console.info(x, y, board_padding_left + x * grid_offset, board_padding_top + (grid_count - 1) * grid_offset);
		board.stroke();
		// board.fillText(grid_count - x + 1,board_padding_left + x * grid_width - 10,board_padding_top + y * grid_width);
	}
	// 画五个点
	// 以对局开始时的黑方为准，棋盘上的纵行线从下到上用阿拉伯数字1～15标记。横行线从左到右用英文字母A～O标记。其中H8点为天元；D4、D12、L12、L4四点为星。天元和星应在棋盘上用直径约为0.5厘米的实心小圆点标出。天元和星在棋盘上起标示位置的作用
	setCircle(board, "D", 12);
	setCircle(board, "L", 12);
	setCircle(board, "H", 8);
	setCircle(board, "D", 4);
	setCircle(board, "L", 4);
}
// drawLine([{"x":0,"y":14},{"x":1,"y":13},{"x":2,"y":12},{"x":3,"y":11},{"x":4,"y":10}]);
function drawLine(position) {
	console.log(position);
	for (var i = 0; i < position.length; i++) {
		// position[i].x++;
		position[i].y++;
	}
	// {"type":9,"data":{"winner":"black","position":[{"x":0,"y":14},{"x":1,"y":13},{"x":2,"y":12},{"x":3,"y":11},{"x":4,"y":10}]}}
	x_start = position[0].x;
	y_start = position[0].y;
	pos_x_start = board_padding_left + x_start * grid_offset;
	pos_y_start = board_padding_top + (grid_count - y_start) * grid_offset;
	x_end = position[4].x;
	y_end = position[4].y;
	pos_x_end = board_padding_left + x_end * grid_offset;
	pos_y_end = board_padding_top + (grid_count - y_end) * grid_offset;
	chesspiece.lineWidth = grid_width;
	chesspiece.beginPath();
	chesspiece.moveTo(pos_x_start, pos_y_start);
	chesspiece.lineTo(pos_x_end, pos_y_end);
	chesspiece.strokeStyle = winner_line_color;
	chesspiece.stroke();
	chesspiece.strokeStyle = board_circle_color;
}
