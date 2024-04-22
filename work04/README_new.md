
## 基本理解
- **this.io.sockets:** 通常指向目前命名空間下所有 sockets 的集合。
- **this.io.sockets.sockets:** 在一些版本中，這是一個 Map，鍵是 socket ID，值是對應的 socket 實例。
- **this.io.engine.clients:** 通常指的是引擎（engine.io）層面上所有活躍連結的集合。
- **this.io.engine.clientsCount:** 活躍連線的數量。
- **this.io.sockets.adapter.rooms:** 裡面會用玩家ID和RoomID做Key，內容會是一個放ID的Set
- **this.io.sockets.adapter.rooms.get(roomName):** 得到放ID的Set
- **this.io.sockets.adapter.sids.get(socketId):** 查看某個客戶端加入哪個房間 


### 【注意】engine引擎层和 Socket.IO 层的差异：
engine.io 是 Socket.IO 的底层，处理低级的传输细节（如 WebSockets 和轮询）。this.io.engine.clients 直接从这个层面上提供信息，可能包含那些还没完全建立或已断开但尚未清除的连接。

### 【注意】在click事件中添加on事件監聽的話可能會被重複綁定
this.socket.on("事件");是有可能被重複綁定的!
所以如果發生同一內容卻多次同時被呼叫
可能是監聽器被重複設定了太多個! 有兩種方法

<pre><code>// 01.移除旧的监听器，避免重复绑定
this.socket.off("Room-announcement");

// 02.在点击事件内部使用.once()监听器
this.socket.once("Room-announcement")</code></pre>

### 【注意】在 Socket.IO 中，adapter 负责管理以下内容：
* ***房间（Rooms）：***
  它维护一个房间列表，每个房间可能包含多个 socket 实例（客户端连接）当一个 socket 加入或离开房间时，adapter 更新其内部的房间状态。

* ***插座标识符（Sockets）：***
  它跟踪每个 socket ID 所加入的所有房间。这可以用来查找给定 socket ID 加入了哪些房间，或者是哪些 socket 在特定的房间内。

* ***消息广播：***
  adapter 负责广播消息给整个命名空间、特定房间或特定的一组 sockets。这包括发送事件、广播数据等。

### 【注意】資料紀錄的形式有很多是用Map或是Set來實現的
<pre><code>rooms: Map(4) {
    'a6UPBBHQOrIQZVetAAAB' => Set(1) { 'a6UPBBHQOrIQZVetAAAB' },
    '0001' => Set(1) { 'a6UPBBHQOrIQZVetAAAB' },
    '0002' => Set(2) { 'a6UPBBHQOrIQZVetAAAB', 'Sh3FP9tw-x317se0AAAD' },
    'Sh3FP9tw-x317se0AAAD' => Set(1) { 'Sh3FP9tw-x317se0AAAD' }
  },
  sids: Map(2) {
    'a6UPBBHQOrIQZVetAAAB' => Set(3) { 'a6UPBBHQOrIQZVetAAAB', '0001', '0002' },
    'Sh3FP9tw-x317se0AAAD' => Set(2) { 'Sh3FP9tw-x317se0AAAD', '0002' }
  },</code></pre>

所以，這時我們可以使用Map的size屬性。要取得所有的鍵，你可以使用Map的keys()方法。 <br>
取得所有UUID，因為它們是作為鍵儲存的
<pre><code>Array.from(socketsMap.keys())</pre></code>

### 【注意】在ON事件中呼叫出的socket.id和在外層呼叫的socket.id是不一樣的??
必須注意，實際上，當玩家開啟網頁時，Socket會記錄id和room名稱的資訊，所以其他的內容，例如我所需要的玩家名稱、形狀、顏色、大小、位置... <br>
這些需要在玩家INIT時一併送出給socket紀錄。

---

## 完整互動邏輯
1. **初始化**
  當Client進入時，Server會先執行檢查當前是否有已經存在的房間`this.constructRoomsList();`，當前使用者一個UUID，還有產生使用者的基礎數值。<br>
  Server傳送`onInitSetME事件`給`該`Client => Client則會在前端顯示自己的ID <br>
  Server傳送`onInit事件`給`所有`Client => 使用者一進入，會先取得自己當前的`UUID`、`已存在的房間`、`客戶端名單`，`this.checkRoomList('init')`則會加入相應的UI <br>
2. **點擊加入房間**
   在取得使用者的`userName`、`roomName`後，`this.ifUserJoinSomeRoom()`會先檢查是否目前UI上已經有存在加入同房間的狀態 <br>
   - 有 => <br> `dialogFuntion.openDialog()`會通知警告訊息。
   - 沒有 => <br> Client會傳送`join-room事件`,並更新Client的使用者名單 : Server會`socket.join(roomName);`、更新userList名稱，更新roomList名單，同時傳送給`所有`Client`Room-announcement事件`，當前加入的用戶的`uuid`、`使用者名稱`、`房間名`、`最新的房間清單`。 <br>
   當Client接收到`Room-announcement事件`後，則會使用`this.checkRoomList('uppdate')`
3. **this.checkRoomList(type, data)房間的更新事件**
   - **init事件:**
     - 因為只要有使用者加入，每個客戶端都會跑一次，所以我們檢查當前介面是否已經有存在任何畫面()，有=>表示這個用戶端是新的
       直接加入所有房間，遍歷roomsList[roomKey]和roomsList[roomKey].user。
   - **update事件:**
     - 我目前的做法是，比較本次roomList和緩存的roomList，得到差異值(是否有新房間)
     - 有新房間 => 確認該房間UI是否已存在有 => 直接加入User;無 => 加入房間和玩家
     - 沒新房間 => 那就是有人加入了某個已存在的房間。
4. **當有使用者離開時**
   - server會收到disconnect事件，會先執行刪除this.clients陣列的資料，在檢查this.roomsList陣列
   - 傳送給`所有`client`removeRoom事件`給`(leaveUserID:String, roomName:String, needRemoveRoom:Bool, this.roomsList:Array, this.clients:Array)`
   - 客戶端目前我是用找roomName和leaveUser名字的方式刪資料，但如果要開放讓玩家可以用同名，那最好還是改成介面全部重渲會比較好。

---

## client.js 流程（使用Socket.IO房間功能）
1. **constructor**
   - 建立socket連線，使用socketInit()執行`on【connect事件】`
   - this.clients   => 客戶端名單 | key:uuid     | value:{uuid:string,name:string,setting:{...}}
   - this.roomsList => 房間名單   | key:roomName | value:[uuid:string,...]
     
2. **on【connect事件】**
    - 當客戶端與伺服器成功建立WebSocket連接，確認連接成功。
    - `【onInitSetME事件】`將自己`id`顯示到頁面上，因為我是把事件放在【connect事件】裡，為了不讓每次有新connect時ID被覆蓋，所以用once，讓這個事件只會在客戶端第一次連線時被監聽到! 
    - `【onInit事件】`以取得初始數據，如自身的`id`，伺服器上現有的`rooms`和`players`資訊。
      - 把伺服器端的roomsList, clientList更新到本地
      - 用`Object.keys(rooms).forEach`遍歷並展示所有房間，使用`checkRoomList("init")`。
    -  `【removeRoom事件】`執行有用戶離開的檢查邏輯。

3. **加入房間操作（$("#join").click()）**
    - `join-room：`發送房間名和用戶名到伺服器，嘗試加入房間。
    - `Room-announcement：`收到加入房間的通知，並更新顯示的房間資訊。
    - `removeRoom：`處理房間移除的事件，更新房間列表和用戶顯示。
4. **對話框功能：**
    - `dialog函數`提供了對話框的開啟和關閉方法。
---

## server.mjs 流程（使用Socket.IO房間功能）
1. **後台設定**
    - 啟動並設定伺服器，包括HTTP服務和WebSocket服務。

2. **io.on('connection', socket => {})**
    - 監聽客戶端的連線事件。
    - **初始化過程**
      - `this.constructRoomsList()` 初始化房間資訊，取得現在有哪些房間
      - 初始化玩家資訊，產生方塊基本數值，放進this.clients[socket.id]
      - 當新的客戶端連線時，使用【onInit事件】發送所有目前的數據，包括連線的客戶端`id`、所有`rooms`和`players`資訊。
    - **on【join-room事件】**
      - 當客戶端發送請求加入房間時，伺服器端接收並處理。
      - 檢查請求的房間是否存在，如果不存在，請建立新房間。
      - 將client的socket加入到該房間（使用`socket.join(roomName)`）。
      - 更新伺服器上的`rooms`資料結構，將新加入的`id`加入對應房間的集合中。
      - 廣播`【Room-announcement事件】`給所有client，通知他們房間清單的最新狀態。
      - 特別注意，現在不需要手動管理`rooms`中的使用者集合，因為Socket.IO會自動處理加入房間的sockets。
    - **客戶端斷線-【disconnect事件】**
      - 執行刪除this.clients陣列的資料，在檢查this.roomsList陣列刪除該使用者，且若該房間不再有使用者，刪除該房間。
3. **數據同步**
   - `constructRoomsList()` 初始化當前所有房間和對應客戶端的 this.roomsList
   - `convertRoomsList：` 將房間列表中的 Set 資料結構轉換為更適合傳輸的 Array 結構。

