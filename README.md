#  跳跳的 Socket.IO 工作坊

Work01 - 多人聊天室 <br>
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/work01/ <br>

參考教學
https://viboloveyou12.medium.com/%E7%94%A8-socket-io-%E6%89%93%E9%80%A0%E5%A4%9A%E4%BA%BA%E8%81%8A%E5%A4%A9%E5%AE%A4-%E4%B8%8B-f7aabc21d3f2 <br>

WebSocket 是一種網路通訊協議，而 Socket.IO 是一個函式庫 <br>
Socket.IO 主要是好在，可以自動降級到其他傳輸方式! <br>

### 開啟方式
01. 定位到app.js所在目錄 cd app.js所在目錄
02. 輸入 node app.js 啟動Server => 終端機印出 app listen at 8080，則表示Server啟動成功！
03. 引用socket時，可能需要用 npm i --save-dev @types/socket.io-client 或是 npm i --save-dev @types/socket.io
04. 再開另一個終端，然後用npm run dev 就可以使用聊天室了！


### 【socket.io 提供的基本方法】
https://socket.io/docs/v3/index.html <br>
- socket.emit — 用於發送事件，接收2參數 => (事件名稱、資料們) 
- socket.on — 用於監聽事件，接收2參數 => (事件名稱、回調函式)
- io.sockets.emit — Server對所有連接的Client發送事件
- socket.broadcast.emit — Client給自己以外的Client發送事件

### 流程回顧
Client獲取用戶輸入的名稱，發送請求給Server (用戶登入) <br>
Server收到名稱，判斷是否為新用戶，並發送事件給Client (登入驗證) <br>
Client收到Server傳來的登入成功或失敗事件，執行相應處理，當用戶發送訊息時，Client將訊息與用戶名稱一起發給Server <br>
Server收到請求後，廣播該訊息給所有連接的Client <br>
Client收到Server傳來的訊息後，判斷用戶名稱是否為自己，對話顯示在相應位置 <br>

### 注意
可能要小心，因為我是在本地端測試，sockets可能會有跨域問題
所以要在假後台裡用這個
var io = require('socket.io')(app, {
    cors: {
        origin: "我用run dev 時開的網址",  // 允许哪些 URL 可以访问资源
        methods: ["GET", "POST"],  // 允许哪些 HTTP 方法访问资源
        allowedHeaders: ["my-custom-header"],  // 允许哪些 HTTP 头部访问资源
        credentials: true  // 是否允许发送 Cookie
    }
});

---

Work02 - Three多人方塊 -no 物理 <br>
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/work02/ <br>




---

Work03 - Three多人方塊 - 有物理 <br>
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/work03/ <br>




---

#### 參考資料：

socket.io套件 <br>
https://socket.io/ <br>

建立多個旋轉方塊(three.js + socket.io)  <br>
https://sbcode.net/threejs/socketio-setup/#  <br>

创建一个3D多人游戏 Create a 3D multi-player game using THREE.js and Socket.IO <br>
https://www.bilibili.com/video/BV1th411J7zo?p=1&vd_source=6debe48d0185b1255e758e98f1436e09 <br>

了解輪巡(Polling)、長輪巡(Long-Polling)、Streaming(串流) <br>
https://blog.gtwang.org/web-development/websocket-protocol/#google_vignette<br>


