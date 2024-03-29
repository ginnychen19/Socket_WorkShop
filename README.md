#  跳跳的 Socket.IO 工作坊

## Work01 - 多人聊天室 
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/work01/ <br>

參考教學
https://viboloveyou12.medium.com/%E7%94%A8-socket-io-%E6%89%93%E9%80%A0%E5%A4%9A%E4%BA%BA%E8%81%8A%E5%A4%A9%E5%AE%A4-%E4%B8%8B-f7aabc21d3f2 <br>

WebSocket 是一種網路通訊協議，而 Socket.IO 是一個函式庫 <br>
Socket.IO 主要是好在，可以自動降級到其他傳輸方式! <br>

### 開啟方式
01. 定位到app.js所在目錄 cd app.js所在目錄
02. 輸入 node app.js 啟動Server => 終端機印出 app listen at 8080，則表示Server啟動成功！
03. 引用socket時，可能需要用 npm i --save-dev socket.io-client 或是 npm i --save-dev socket.io
04. 再開另一個終端，然後用npm run dev 就可以使用聊天室了！


### 【socket.io 提供的基本方法】
https://socket.io/docs/v3/index.html <br>
- socket.emit           — 用於發送事件，接收2參數 => (事件名稱、資料們) 
- socket.on             — 用於監聽事件，接收2參數 => (事件名稱、回調函式)
- io.sockets.emit       — Server對所有連接的Client發送事件 ( 包含自己 )
- socket.broadcast.emit — Client給'自己以外'的Client發送事件

### 流程回顧
Client獲取用戶輸入的名稱，發送請求給Server (用戶登入) <br>
Server收到名稱，判斷是否為新用戶，並發送事件給Client (登入驗證) <br>
Client收到Server傳來的登入成功或失敗事件，執行相應處理，當用戶發送訊息時，Client將訊息與用戶名稱一起發給Server <br>
Server收到請求後，廣播該訊息給所有連接的Client <br>
Client收到Server傳來的訊息後，判斷用戶名稱是否為自己，對話顯示在相應位置 <br>

### 加入Fly.io 後端部署平台
https://fly.io/ <br>
https://ithelp.ithome.com.tw/articles/10307847 <br>

01. 在vscode開啟powershell 版本的終端機，輸入 => powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
02. 然後去確認系統的環境變數是否設定好 => 檢查方式參考 https://zonego.tw/2022/01/07/windows11-path/ <br>
    或是直接輸入 $env:Path += ";C:\Users\ASUS\.fly\bin"
03. 關掉vscode，然後重新啟動powershell，輸入 flyctl auth login 登入帳號 (沒有的話去辦一個)
04. 接著，把我們的server檔獨立到一個資料夾裡面，並且建立一個package.json
    然後加入
    <pre><code>"scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "start": "node <你的server檔>",
        "dev":"npx nodemon <你的server檔>"
    },</code></pre> 
05. 把終端機cd(移動)到要上傳到fly.io的sever資料夾    
06. 在終端執行 flyctl launch 做完自己的新開檔案設定
07. 在終端執行 fly deploy 把sever檔案上傳到fly.io，這樣就可以使用拉~
08. 如果Port不是用預設的3000記得在使用fly deploy前，手動修改環境變數!!
09. 第一次開啟的時候可能會遇到連線問題，有可能是因為還保存之前有問題的緩存，可以重新載入就能解決這問題

---

## Work02 - Three多人方塊 -no 物理 
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/work02/ <br>

使用express => npm i express
使用時，因為express會設定要取用物件的路徑，所以我設定時，要符合我用parcel打包的路徑

### 主要交互的方式是這樣
每次有新客戶端開啟時，我們會在客戶端隨機產生一個方塊 <br> 
當我們接受到伺服器產生給該客戶端的id時【id事件】 <br> 

我們就在客戶端使用【update事件】，通知伺服器該方塊第一次生成的
{時間戳記、顏色、位置、旋轉、尺寸、旋轉速度、旋轉軸} <br> 

這時，伺服器端會把 {這些資訊} 更新進到 this.clients{} 物件中。 <br> 

然後，我們在這時，如果方塊有動畫之類的，就會在客戶端的Update(可能是移動檔裡的update())一直更新數值，一直丟【update事件】給伺服器端。 <br>

然後伺服器端在透過【clients事件】一直發給客戶端所有的方塊!! <br> 
這時，客戶端只需要在收到伺服器傳來的 【clients事件】時，一直利用裡面的資訊更新位置就可以了!。 <br> 

也就是說，實際上我們的移動就不會是直接控制模型動，而是把clients事件裡的所有物件都一直渲染(放在Main的update()裡) <br> 

至於刪除的部分 <br> 
客戶端斷掉連線，伺服器端會先知道，觸發【disconnect 事件】 <br> 
所以伺服器端會先刪除this.clients[id]這個方塊的所有資料 <br> 
然後，我們再通知客戶端有【removeClient事件】，要執行scene.remove這個動作。 <br> 
如果不這樣做的話，物件就只會停止更新移動，但是客戶端還是會看到它，因為它不會消失。 <br> 


### 請參考learn => Three.js-TypeScript-Boilerplate
01. 首先先看他的開啟方式，他在開發模式下(npm run dev)，有使用到Node的concurrently套件，分別執行了三個指令，他分開指令的方式是這樣  \" <你的指令> \"
-k："kill others on fail"，即如果其中一個命令失敗（即退出狀態非零），concurrently 將終止所有其他正在運行的命令。
* "tsc -p ./src/server -w"：
    - tsc：這是TypeScript的編譯器。
    - -p ./src/server：這個參數告訴 tsc 使用位於 ./src/server 的 tsconfig.json 設定檔。
    - -w：這意味著編譯器將在觀察模式下運行，也就是說，如果原始檔案發生變化，編譯器將重新編譯專案。

* "nodemon ./dist/server/server.js"：
    - nodemon：這是一個工具，用於在偵測到檔案變更時重新啟動Node.js應用程式。
    - ./dist/server/server.js：這是 nodemon 將運行和監視的JavaScript檔案。

* "webpack serve --config ./src/client/webpack.dev.js"：
    - webpack：這是一個模組打包工具。
    - serve：這個參數告訴webpack啟動一個開發伺服器，通常用於前端專案的熱重載。
    - --config ./src/client/webpack.dev.js：這告訴webpack使用位於 ./src/client/webpack.dev.js 的設定檔。

### 踩坑注意
- this.socket = io('ws://localhost:3000');一但被加入，就表示客戶端已經呼喚過伺服器了，所以我如果把客戶端的connect事件放到很久之後才操作，那就可能造成伺服器想要傳資訊給我們，但是我們的客戶端卻一直沒有事件接收<br>
this.socket = io('ws://localhost:3000');請和connect事件放在一起!

---

## Work03 - Three多人方塊 - 有物理 
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/work03/ <br>



---
## 踩坑注意
01. 
socket.io需要處理跨域問題(如果客户端和服务器端不在同一个域上)，所以要在假後台裡用這個 <br> 
<pre><code>var io = require('socket.io')(app, {
    cors: {
        origin: "我用run dev 時開的網址",  // 允许哪些 URL 可以访问资源
        methods: ["GET", "POST"],  // 允许哪些 HTTP 方法访问资源
        allowedHeaders: ["my-custom-header"],  // 允许哪些 HTTP 头部访问资源
        credentials: true  // 是否允许发送 Cookie
    }
});</code></pre>
如果是直接用原生的websocket，則可以不用處理cors <br> 
原生 WebSocket 協定 (ws:// 和 wss://) 並未直接受 CORS 策略的限制，因為 WebSocket 不遵循同源策略（SOP）<br> 
大多數情況下不強制要求 CORS 回應頭。 <br> 

02. 
在示範的server中，Leaen中的伺服器案例有使用Express建立Server<br> 
但我個人直接使用 http.createServer()<br> 
Express提供了路由、中介軟體等功能(express.static)<br> 
所以他可以自由定義資料來源的路徑<br> 
也可以在請求和回應之間插入處理邏輯，可實現各種功能（如日誌記錄、請求體解析、身份驗證等）<br> 

---

## 參考資料：

socket.io套件 <br>
https://socket.io/ <br>

建立多個旋轉方塊(three.js + socket.io)  <br>
https://sbcode.net/threejs/socketio-setup/#  <br>

创建一个3D多人游戏 Create a 3D multi-player game using THREE.js and Socket.IO <br>
https://www.bilibili.com/video/BV1th411J7zo?p=1&vd_source=6debe48d0185b1255e758e98f1436e09 <br>

了解輪巡(Polling)、長輪巡(Long-Polling)、Streaming(串流) <br>
https://blog.gtwang.org/web-development/websocket-protocol/#google_vignette<br>


