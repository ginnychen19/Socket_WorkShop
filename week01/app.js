/* 我的假後台 */
/* 01.建立http服務*/
var app = require('http').createServer()
var io = require('socket.io')(app);/*引入socket.io*/

/* 02.自訂監聽端口*/
var port = 8080;
app.listen(port);
console.log('終端機提示:' + port + ' 端口，連接上拉~');

/* 03.監聽 連線狀態*/
io.on('connection', function (socket) {
    /* 03-1. 用.on("自定義事件名稱"，方法(資料)) 監聽登入事件 */
    socket.on('login', function (data) {
        console.log(data); // 如果在後台用console.log，login事件的資料，我們會在假後台(終端機)裡看到

        /* 03-2.用.emit 回傳登入名稱 */
        //從這裡收到的內容就是伺服器給的資料
        socket.emit('login', {
            massage: "我是從伺服器傳回的",
            username: data.username
        });
        
    })
})



