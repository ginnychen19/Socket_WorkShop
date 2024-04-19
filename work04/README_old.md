### 資料格式
rooms 在server端的是用 rooms[roomName] = new Set(); 建立的 <br>
<pre><code>rooms = {
         0001: [gjWvqd_gvjwcBDZHAAAD],
         0002: [M7kmNxmJ5HDYcnmeAAAF]
         }</code></pre>

players 在server端的是用 players = new Map();; 建立的<br>
<pre><code>players = [
             ['gjWvqd_gvjwcBDZHAAAD', {shape: "square", size: 2, pos: {x: 0, y: 0, z: 0}, rot: 0...}],
             ['M7kmNxmJ5HDYcnmeAAAF', {shape: "circle", size: 10, pos: {x: 0, y: 0, z: 0}, rot: 0...}]  
          ]</code></pre>

---

### client.js
1. **on【connect事件】**
    - 確認建立連線 
    - on【onInit事件】獲得之前已經有的資料，並且在畫面上呈現，包括 id, rooms, players 
         id會給$("#myID").text(id)
         rooms, players，則會透過Object.keys(rooms).forEach的方式遍歷

2. **點擊加入按鈕，$("#join").click()**
   -  emit【join-room事件】給Server 該玩家的ID，加入哪間房間 
   - 【onJoinRoom事件】接收Server的資料，並且在畫面上呈現 

3. **on【updateRoom事件】**
   - 接收Server的rooms資料，並且在畫面上直接用迴圈把全部重新改過<br>
     (用`.html()`，`.append()`可能會導致重複加入) 
   
---

### server.mjs
1. 建立後台
2. **io.on('connection', socket => {});**
   - 更新所有玩家 players 的資料
   - emit【onInit事件】傳送目前已經有的所有資料，包括本地玩家，rooms、players的資料
   - on【join-room事件】把資料更新到rooms裡 <br>
     rooms[roomName]不存在 => 開一個新的 rooms[roomName] 的記憶體 <br>
     用 rooms[roomName].add(socket.id); 給該房間加入該玩家資訊 <br>
     emit【updateRoom事件】傳送目前的client <br>