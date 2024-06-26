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

### 檔案邏輯
01. server.mjs
    - 引入模組：引入了 Node.js 的 http 模組和 Socket.IO 的 Server 模組【getId事件】。
    - 伺服器設定：建立了一個基於 HTTP 的伺服器，並且為 Socket.IO 實例配置了跨網域資源共用（CORS）選項。
    - 客戶端追蹤：初始化了一個物件 clients 用於追蹤所有連接的客戶端名單。
    - 連接處理：
        - 當新的客戶端連線時，伺服器會列印出該客戶端的 socket.id。
        - 將客戶端的設定（位置、旋轉等）儲存在 clients 物件中(主要是為了寫好資料格式)。
        - 對於斷開連線的客戶端，從 clients 物件中刪除其記錄，並向所有客戶端廣播 【removeClient事件】。
    - 客戶端更新：接收客戶端發送的 【giveSetting事件】，更新 clients 對象，並向所有客戶端廣播 【updateClients事件】。
    - 啟動伺服器：監聽指定端口，當伺服器開始監聽時在控制台輸出提示訊息。
02. main.js
場景設定：初始化了 Three.js 的渲染器、場景、相機、控制器。
    - 資源加載：加載了模型、地板等。
    - 建立 Socket.IO 用戶端：連接到伺服器，處理連線、中斷、接收 ID、更新客戶端清單等事件。
    - 處理 Socket.IO 事件：
        - 【getId事件】：收到伺服器指派的 ID 後，用戶端會傳送 "giveSetting" 事件，包含隨機產生的方塊資訊。
        - 【removeClient事件】：當有客戶端斷開連線時，請從場景移除對應的方塊。
        - 【updateClients事件】：更新或建立用戶端清單中的方塊，以顯示目前所有線上用戶端的方塊。    
          
03. 兩個檔案的互動方式： <br>
    客戶端透過 【giveSetting事件】傳送自己的方塊資訊給伺服器，伺服器更新這些資訊並透過 【updateClients事件】廣播給所有客戶端。 <br>
    當客戶端接收到 【updateClients事件】時，根據接收到的資訊更新或建立對應的方塊。  <br>
    當客戶端斷開連線時，伺服器廣播 【removeClient事件】，其他客戶端接收到這個事件後會移除對應的方塊。  <br>

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

### 資料收取的方式
1.  Client (可以考慮指整理出同一個room的名單)
    <pre><code>this.clientList = { 
        'uuid01':{  id: 'uuid01', 
                    userName: 'user01',
                    playerState: 'srting', 
                    setting: {...} 
                },
    };
    this.roomList = {
        "roomName01": ["uuid01",...],...
        };
    this.MyRoomMates = [ 'uuid01', 'uuid02', 'uuid03' ];</code></pre>
2.  Server (要收到所有人的資訊)
    -   playerState => init(初始化) | prepare(準備中) | ready(準備好) | idle(禁止) | walk(走) | run(跑) | jump(跳) | die(死) <br>
    <pre><code>this.clientList[socketId] = { 
        id: socketId,
        userName: '',
        playerState: 'srting',
        setting: {
            color: data.color,
            size: data.size,
            pos: { x: data.posX, y: data.posY, z: data.posZ },
            rot: { x: data.rotX, y: data.rotY, z: data.rotZ }
        }
    }</code></pre>


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


