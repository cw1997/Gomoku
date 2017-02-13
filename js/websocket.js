/**
 * 核心业务逻辑
 * 1.连接上websocket服务端后，服务端发送当前客户端的uid，通过消息GET_UID
 * 2.客户端可选择主动与指定uid的另一客户端对战，或者等待另一客户端主动对我发起对战，通过消息CHALLENGE_OTHER
 * 3.如果收到来自A的挑战请求TAKE_ON_CHALLENGE，则B弹出confirm，
 * true时发送TAKE_ON_CHALLENGE_ACK给服务端，服务端随机分配黑白方，并且发送START_GAME信号；
 * false时发送TAKE_ON_CHALLENGE_RST给服务端，服务端向挑战发起者发送TAKE_ON_CHALLENGE_RST信号，携带上拒绝者uid。
 * 4.对战开始，通过消息START_GAME
 * 5.服务端读秒并发回读秒结果给客户端，客户端渲染读秒视图，通过消息GET_SECOND（读秒功能还未开发）
 * 6.服务端发送落子状态给客户端，通过消息DOWNLOAD_PIECE_MOVES（为了安全考虑，客户端只有在收到服务端发来的落子请求才渲染Canvas棋盘，即使是己方行棋，也是先上报服务端，服务端再发回客户端走棋状态）
 * 7.客户端上报落子状态给服务端，通过消息UPLOAD_PIECE_MOVES
 * 6.如果读秒超时则终止比赛，并发回游戏结果消息，客户端收到结果后渲染对应视图，通过消息GET_SCORE（读秒功能还未开发）
 * 7.如果构成活五则终止比赛，并发回游戏结果消息，客户端收到结果后渲染对应视图，通过消息GET_SCORE
 * 8.更新服务端上对应客户端的游戏状态为空闲
 * 9.重新开始步骤2
 */
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

var websocket;

var uid;

function connect(wsUri) {
	websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) {
        onOpen(evt)
    };
    websocket.onclose = function(evt) {
        onClose(evt)
    };
    websocket.onmessage = function(evt) {
        onMessage(evt)
    };
    websocket.onerror = function(evt) {
        onError(evt)
    };
}
function onOpen(evt) {
    // alert('连接成功');
    console.info("CONNECTED");
    // doSend('{"username":"' + document.getElementById('username').value + '"}');
}
function onClose(evt) {
    alert('与主机连接失败');
    location.reload();
    console.info("DISCONNECTED");
}
function onMessage(evt) {
    console.info('receive:'+ evt.data);
    data = json2object(evt.data);
    switch (data.type) {
        case GET_UID: // 获取用户UID
            uid = data.data.uid;
            writeText('uid', uid);
            doSend(buildJson(GET_PLAYER_LIST, {}));
            setInterval(function() {
                // 游戏开始后不刷新玩家列表
                if (game_status) return;
                doSend(buildJson(GET_PLAYER_LIST, {}));
            }, 5000);
        break;
        case CHALLENGE_OTHER: // 发起对战
        break;
        case TAKE_ON_CHALLENGE: // 接受对战提示
            choose = confirm('您是否要接受来自 ' + data.data.challenger_uid + ' 的挑战？');
            if (choose) {
                doSend(buildJson(TAKE_ON_CHALLENGE_ACK, {target_uid:data.data.challenger_uid}));
            } else {
                doSend(buildJson(TAKE_ON_CHALLENGE_RST, {target_uid:data.data.challenger_uid}));
            }
        break;
        case TAKE_ON_CHALLENGE_ACK: // 同意接受对战
        break;
        case TAKE_ON_CHALLENGE_RST: // 拒绝接受对战
            alert('uid为 ' + data.data.target_uid + ' 的对方拒绝了你的挑战请求');
        break;
        case START_GAME: // 开始游戏
            initiateChesspieceState();
            game_status = true;
            /*setInterval(function() {
                doSend(buildJson(GET_SECOND, {}));
            }, 1000);*/
            writeText('black_uid', data.data.black_uid);
            writeText('white_uid', data.data.white_uid);
            writeText('black_ip', data.data.black_ip);
            writeText('white_ip', data.data.white_ip);
            document.getElementById('player-list').style.display = 'none';
        break;
        case REFUSE_GAME: // 拒绝接受对战
        break;
        case DOWNLOAD_SECOND: // 读秒数据（常规比赛双方各10*60秒）
            writeText('black_second', data.data.black_second);
            writeText('white_second', data.data.white_second);
        break;
        case GET_SCORE: // 分数成绩时间等信息
            game_status = false;
            drawLine(data.data.position);
            alert('winner:' + data.data.winner);
            document.getElementById('player-list').style.display = 'block';
        break;
        case DOWNLOAD_PIECE_MOVES: // 服务端发送落子状态
            setChesspiece(data.data.x ,data.data.y, data.data.isBlack, data.data.index);
            document.getElementById('log').value += '' + data.data.index + ':' + (data.data.isBlack ? '黑方' : '白方') + '在(' + data.data.x + ',' + data.data.y + ')处落子\n';
        break;
    	case UPLOAD_PIECE_MOVES: // 客户端上报落子状态
            // doSend(buildJson(UPLOAD_PIECE_MOVES, {x:char2ascii(chesspiece_position_x), y:grid_count - chesspiece_position_y}));
		break;
        case GET_SECOND:
        break;
        case GET_PLAYER_LIST:
        break;
        case DOWNLOAD_PLAYER_LIST:
            player_list = document.getElementById('player-list');
            lis = player_list.getElementsByTagName('li');
            while ( lis.length > 0 ) {
                player_list.removeChild(lis[0]);
            }
            for (var i = 0; i < data.data.list.length; i++) {
                uid_temp = data.data.list[i].id;
                player_item = document.createElement('li');
                player_item.innerHTML = 'uid:' + uid_temp;
                player_id = document.createElement('button');
                player_id.innerHTML = '挑战:' + uid_temp + '号玩家';
                player_id.uid = uid_temp;
                player_id.onclick = function () {
                    doSend(buildJson(CHALLENGE_OTHER, {uid:this.uid}));
                }
                if ( uid_temp == uid ) {
                    player_item.style.display = 'none';
                }
                player_item.appendChild(player_id);
                player_list.appendChild(player_item);
            }
        break;
    }
}
function onError(evt) {
    alert('websocket连接错误');
    // location.reload();
    console.info('error:'+ evt.data);
    websocket.close();
}
function doSend(message) {
    console.info("SENT: " + message);
    websocket.send(message);
}

/*window.document.onkeydown = keyPress;
function keyPress(evt){
    evt = (evt) ? evt : window.event
    if (evt.keyCode) {
        // keycode 37 = Left
        // keycode 38 = Up
        // keycode 39 = Right
        // keycode 40 = Down
        switch (evt.keyCode) {
            case 37:
            console.info("←");
            break;
            case 38:
            console.info("↑");
            break;
            case 39:
            console.info("→");
            break;
            case 40:
            console.info("↓");
            break;
        }
    }
}*/
/*keycode 8 = BackSpace BackSpace
keycode 9 = Tab Tab
keycode 12 = Clear
keycode 13 = Enter
keycode 16 = Shift_L
keycode 17 = Control_L
keycode 18 = Alt_L
keycode 19 = Pause
keycode 20 = Caps_Lock
keycode 27 = Escape Escape
keycode 32 = space space
keycode 33 = Prior
keycode 34 = Next
keycode 35 = End
keycode 36 = Home
keycode 37 = Left
keycode 38 = Up
keycode 39 = Right
keycode 40 = Down
keycode 41 = Select
keycode 42 = Print
keycode 43 = Execute
keycode 45 = Insert
keycode 46 = Delete
keycode 47 = Help
keycode 48 = 0 equal braceright
keycode 49 = 1 exclam onesuperior
keycode 50 = 2 quotedbl twosuperior
keycode 51 = 3 section threesuperior
keycode 52 = 4 dollar
keycode 53 = 5 percent
keycode 54 = 6 ampersand
keycode 55 = 7 slash braceleft
keycode 56 = 8 parenleft bracketleft
keycode 57 = 9 parenright bracketright
keycode 65 = a A
keycode 66 = b B
keycode 67 = c C
keycode 68 = d D
keycode 69 = e E EuroSign
keycode 70 = f F
keycode 71 = g G
keycode 72 = h H
keycode 73 = i I
keycode 74 = j J
keycode 75 = k K
keycode 76 = l L
keycode 77 = m M mu
keycode 78 = n N
keycode 79 = o O
keycode 80 = p P
keycode 81 = q Q at
keycode 82 = r R
keycode 83 = s S
keycode 84 = t T
keycode 85 = u U
keycode 86 = v V
keycode 87 = w W
keycode 88 = x X
keycode 89 = y Y
keycode 90 = z Z
keycode 96 = KP_0 KP_0
keycode 97 = KP_1 KP_1
keycode 98 = KP_2 KP_2
keycode 99 = KP_3 KP_3
keycode 100 = KP_4 KP_4
keycode 101 = KP_5 KP_5
keycode 102 = KP_6 KP_6
keycode 103 = KP_7 KP_7
keycode 104 = KP_8 KP_8
keycode 105 = KP_9 KP_9
keycode 106 = KP_Multiply KP_Multiply
keycode 107 = KP_Add KP_Add
keycode 108 = KP_Separator KP_Separator
keycode 109 = KP_Subtract KP_Subtract
keycode 110 = KP_Decimal KP_Decimal
keycode 111 = KP_Divide KP_Divide
keycode 112 = F1
keycode 113 = F2
keycode 114 = F3
keycode 115 = F4
keycode 116 = F5
keycode 117 = F6
keycode 118 = F7
keycode 119 = F8
keycode 120 = F9
keycode 121 = F10
keycode 122 = F11
keycode 123 = F12
keycode 124 = F13
keycode 125 = F14
keycode 126 = F15
keycode 127 = F16
keycode 128 = F17
keycode 129 = F18
keycode 130 = F19
keycode 131 = F20
keycode 132 = F21
keycode 133 = F22
keycode 134 = F23
keycode 135 = F24
keycode 136 = Num_Lock
keycode 137 = Scroll_Lock
keycode 187 = acute grave
keycode 188 = comma semicolon
keycode 189 = minus underscore
keycode 190 = period colon
keycode 192 = numbersign apostrophe
keycode 210 = plusminus hyphen macron
keycode 211 =
keycode 212 = copyright registered
keycode 213 = guillemotleft guillemotright
keycode 214 = masculine ordfeminine
keycode 215 = ae AE
keycode 216 = cent yen
keycode 217 = questiondown exclamdown
keycode 218 = onequarter onehalf threequarters
keycode 220 = less greater bar
keycode 221 = plus asterisk asciitilde
keycode 227 = multiply division
keycode 228 = acircumflex Acircumflex
keycode 229 = ecircumflex Ecircumflex
keycode 230 = icircumflex Icircumflex
keycode 231 = ocircumflex Ocircumflex
keycode 232 = ucircumflex Ucircumflex
keycode 233 = ntilde Ntilde
keycode 234 = yacute Yacute
keycode 235 = oslash Ooblique
keycode 236 = aring Aring
keycode 237 = ccedilla Ccedilla
keycode 238 = thorn THORN
keycode 239 = eth ETH
keycode 240 = diaeresis cedilla currency
keycode 241 = agrave Agrave atilde Atilde
keycode 242 = egrave Egrave
keycode 243 = igrave Igrave
keycode 244 = ograve Ograve otilde Otilde
keycode 245 = ugrave Ugrave
keycode 246 = adiaeresis Adiaeresis
keycode 247 = ediaeresis Ediaeresis
keycode 248 = idiaeresis Idiaeresis
keycode 249 = odiaeresis Odiaeresis
keycode 250 = udiaeresis Udiaeresis
keycode 251 = ssharp question backslash
keycode 252 = asciicircum degree
keycode 253 = 3 sterling
keycode 254 = Mode_switch*/