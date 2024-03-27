Three.js-TypeScript-Boilerplate 學習筆記 <br>

### 開啟方式
01. https://sbcode.net/threejs/threejs-typescript-boilerplate/
02. https://github.com/Sean-Bradley/Three.js-TypeScript-Boilerplate
03. git checkout socketio => 這樣就切到有 socketio 的分支了
04. 直接 npm run dev 就行!

### package.json
01. nodemon ：這樣每當伺服器腳本更新時它就會自動重新啟動 Node.js，
02. concurrently ：這樣我們就可以使用同一個終端機在監視模式下執行 webpack、nodemon 和 TSC。如果我們不同時使用，那麼我們可以在它們自己的終端中單獨啟動這 3 個進程。並發使得同時啟動多個進程變得更容易。
03. webpack：這與之前相同。它將使用帶有 ./src/client/webpack.dev.js 配置的 Webpack Dev Server。


### 撰寫邏輯

#### server.ts
01. 引入express、Socket
02. 伺服器建立，一樣有設定路由
03. socket - 當伺服器連線上時
    - 在終端宣告有一個socket被建立了
    - 把使用者的UUid加入到 this.clients{} 物件中
    - 設定伺服器端有一個 【id事件】，發送給客戶端當前的UUid
    - 當客戶端斷掉連線 【disconnect事件】時，會在終端宣告誰退出了 <br> 
      並且把使用者的UUid從 this.clients{} 物件中移除 <br> 
      然後要記得也要告知客戶端發送被刪除者的socket.id，觸發【removeClient事件】
    - 接收從客戶端傳來的 【update事件】，會收到當前的時間、模型位置、旋轉量，把它更新給伺服器裡存的 this.clients{} 們。
04. 一直向客戶端發送 【clients事件】，把 this.clients{} 發送給客戶端!
05. 把 this.server.listen寫成 Start()事件，並在最後new App(port).Start()啟用。

#### client.ts

01. 基本有初始化場景、畫面RWD
02. 加入一個隨機的綠色方塊(隨機生成位置)、生成地板、加入相機位置
03. socket - 處理的部分
    - socket 收到伺服器時會觸發 connect 事件，反之伺服器斷線也會觸發 disconnect 事件
    - 客戶端 在收到 伺服器的 【id事件】後，會用setInterval 一直給伺服器發送 【update事件】，包括當前的時間、模型位置、旋轉量
    - 我們會一直收到伺服器傳來 【clients事件】，在這裡 <br> 
    我們會遍歷 this.clients{} 物件，透過計算獲得每個clients的Ping <br> 
    然後我們會檢查有沒有沒加入過的模型，有的話則執行更新位置與旋轉量
    - 如果收到伺服器傳來的 【removeClient事件】，則會刪除該id的方塊。
04. 加入 GUI 介面
05. 實際渲染動畫


#### 主要交互的方式是這樣
每次有新客戶端開啟時，我們會在客戶端隨機產生一個方塊 <br> 
當我們接受到伺服器產生給該客戶端的id時【id事件】 <br> 
我們就在客戶端使用【update事件】，通知伺服器該方塊第一次生成的位置與旋轉量。 <br> 
這時，伺服器端會一直把當前的時間、模型位置、旋轉量更新進到 this.clients{} 物件中。 <br> 
然後伺服器端在透過【clients事件】一直發給客戶端所有的方塊!! <br> 
這時，客戶端只需要在收到伺服器傳來的 【clients事件】時，一直利用裡面的資訊更新位置就可以了!。 <br> 

至於刪除的部分 <br> 
客戶端斷掉連線，伺服器端會先知道，觸發【disconnect 事件】 <br> 
所以伺服器端會先刪除this.clients[id]這個方塊的所有資料 <br> 
然後，我們再通知客戶端有【removeClient事件】，要執行scene.remove這個動作。 <br> 
如果不這樣做的話，物件就只會停止更新移動，但是客戶端還是會看到它，因為它不會消失。 <br> 

---

#### 參考資料：

socket.io套件 <br>
https://socket.io/ <br>

建立多個旋轉方塊(three.js + socket.io)  <br>
https://sbcode.net/threejs/socketio-setup/#  <br>

了解輪巡(Polling)、長輪巡(Long-Polling)、Streaming(串流) <br>
https://blog.gtwang.org/web-development/websocket-protocol/#google_vignette<br>


