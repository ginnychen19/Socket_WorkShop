//   /* 有玩家加入某房間 */
//   socket.on('join-room', roomName => {
//     socket.join(roomName);
//     if (!rooms[roomName]) {
//         rooms[roomName] = new Set(); //建立一個像陣列的東西
//     }
//     rooms[roomName].add(socket.id);
//     console.log(`用户 ${socket.id} 已加入房间 ${roomName}`);
//     console.log(rooms);
//     // 只會傳訊息告訴同房玩家，有某個玩家加入房間
//     // io.to(roomName).emit('updateRoomPlayer', socket.id, roomName);
//     // // 傳給所有連上伺服器的玩家，更新房間數量
//     socket.emit('updatePlayers', convertToArray(rooms));
// });

// // 离开房间
// socket.on('leave-room', roomName => {
//     socket.leave(roomName);
//     rooms[roomName].delete(socket.id);
//     if (rooms[roomName].size === 0) {
//         delete rooms[roomName];
//     } else {
//         socket.to(roomName).emit('user-left', socket.id, Array.from(rooms[roomName]));
//     }
// });

/* 我的假後台 */
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

/* 01.建立http服務*/
var app = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>server 正在運行！</h1>');
});
var io = new SocketIOServer(app, {
    cors: {
        origin: ["https://gotoo.co",
            "http://localhost:1234",
            "http://127.0.0.1:5500",
            "http://127.0.0.1:5501",],  // 允许哪些 URL 可以访问资源
        methods: ["GET", "POST"],  // 允许哪些 HTTP 方法访问资源
        allowedHeaders: ["my-custom-header"],  // 允许哪些 HTTP 头部访问资源
        credentials: true  // 是否允许发送 Cookie
    }
});

/* 02.自訂監聽端口*/
var port = 8080;
app.listen(port);
console.log('終端機提示:' + port + ' 端口，連接上拉~');

const rooms = {};
const players = new Map();
/* 
rooms = {
    'roomName01': new Set(),
    'roomName02': new Set(),
};
players = {
    'socket.id01': {"性別": "女"},
    'socket.id02': {"性別": "男"},
};
*/

/* 資料轉換 */
function convertToArray(obj) {
    const result = {};
    if (!obj) return "沒有內容物";
    else {
        for (const key in obj) {
            result[key] = Array.from(obj[key]);
        }
        return result;
    }
};

io.on('connection', socket => {
    // 01.給id、02.rooms名單、03.players名單
    players.set(socket.id, { name: socket.id });
    socket.emit('onInit', socket.id, convertToArray(rooms), [...players]);//每次有新的人都會發送給客戶端
    
    io.fetchSockets() 
    
    // console.log("有多少玩家");
    // console.log([...players]);
    // console.log("有多少房間");
    // console.log(convertToArray(rooms));

    /* 有玩家加入某房間 */
    socket.on('join-room', roomName => {
        socket.join(roomName);
        if (!rooms[roomName]) {
            rooms[roomName] = new Set(); //建立一個像陣列的東西
        }
        rooms[roomName].add(socket.id);
        console.log(`用户 ${socket.id} 已加入房间 ${roomName}`);
        console.log(rooms);
        // 只會傳訊息告訴同房玩家，有某個玩家加入房間
        // io.to(roomName).emit('updateRoomPlayer', socket.id, roomName);
        // // 傳給所有連上伺服器的玩家，更新房間數量
        socket.emit('updatePlayers', convertToArray(rooms));
    });
    
    // 离开房间
    socket.on('leave-room', roomName => {
        socket.leave(roomName);
        rooms[roomName].delete(socket.id);
        if (rooms[roomName].size === 0) {
            delete rooms[roomName];
        } else {
            socket.to(roomName).emit('user-left', socket.id, Array.from(rooms[roomName]));
        }
    });

    // 监听断开连接事件
    socket.on('disconnect', () => {
        // 遍歷所有roomName，看哪個房間有這個socket.id，就把它從房間中移除
        for (let roomName in rooms) {
            if (rooms[roomName].has(socket.id)) {
                rooms[roomName].delete(socket.id);
                socket.to(roomName).emit('user-left', socket.id, Array.from(rooms[roomName]));
                if (rooms[roomName].size === 0) {
                    delete rooms[roomName];
                }
            }
        }
    });

    // 向房间发送消息
    socket.on('room-message', (roomName, message) => {
        socket.to(roomName).emit('message', message);
    });
});




