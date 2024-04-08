/* 我的假後台 */
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

/* 01.建立http服務*/
var app = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>server 正在運行！</h1>');
});

// var io = require('socket.io')(app);/*引入socket.io*/
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

/* 03.監聽 連線狀態*/
// io.on('connection', function (socket) {
//     /* 03-1. 用.on("自定義事件名稱"，方法(資料)) 監聽登入事件 */
//     socket.on('login', function (data) {
//         console.log(data); // 如果在後台用console.log，login事件的資料，我們會在假後台(終端機)裡看到

//         /* 03-2.用.emit 回傳登入名稱 */
//         //從這裡收到的內容就是伺服器給的資料
//         socket.emit('login', {
//             massage: "我是從伺服器傳回的",
//             username: data.username
//         });

//     })
// })

/* 04-1.用戶陣列*/
let users = [];

/* 04-2.如果該名稱不在陣列內，就將它視為新用戶並成功登入*/
io.on('connection', function (socket) {
    /*是否為新用戶*/
    let isNewPerson = true;
    /*當前登入用戶*/
    let username = null;

    // 05.監聽登入
    socket.on('login', function (data) {
        for (var i = 0; i < users.length; i++) {
            isNewPerson = (users[i].username === data.username) ? false : true;
        }
        if (isNewPerson) {
            username = data.username
            users.push({
                username: data.username
            })
            data.userCount = users.length
            /*發送 登入成功 事件*/
            socket.emit('loginSuccess', data)
            /*向所有連接的用戶廣播 add 事件*/
            io.sockets.emit('add', data)

            /* 我檢查用的 */
            socket.emit('login', {
                massage: "我是從伺服器傳回的",
                username: data.username
            });
        } else {
            /*發送 登入失敗 事件*/
            socket.emit('loginFail', '')
        }
    })

    // 06.監聽登出
    socket.on('logout', function () {
        /* 發送 離開成功 事件 */
        socket.emit('leaveSuccess');
        users.map(function (val, index) {
            if (val.username === username) {
                users.splice(index, 1);
            }
        })
        /* 向所有連接的用戶廣播 有人登出 */
        io.sockets.emit('leave', { username: username, userCount: users.length })
    })

    //07.監聽 客戶端 發送到 伺服器 的訊息
    socket.on('sendMessage', function (data) {
        /*發送receiveMessage事件*/
        io.sockets.emit('receiveMessage', data)
    })
    //08.監聽 客戶端 自動斷線的情況
    socket.on('disconnect', () => {
        if (username) {
            users = users.filter(user => user.username !== username);
            // 向所有连接的客户端广播有人退出
            io.sockets.emit('leaveAuto', { username: username, userCount: users.length });
            console.log(username + ' 断开了连接');
        }
    });
})




