#  跳跳的 Three.js 工作坊

![工作坊進度圖](workshop.jpg)

Week01 - 加入Socket.IO <br>
https://gotoo.co/demo/elizabeth/Frontend_Workshop/socket/week01/ <br>

https://viboloveyou12.medium.com/%E7%94%A8-socket-io-%E6%89%93%E9%80%A0%E5%A4%9A%E4%BA%BA%E8%81%8A%E5%A4%A9%E5%AE%A4-%E4%B8%8B-f7aabc21d3f2 <br>

WebSocket 是一種網路通訊協議，而 Socket.IO 是一個函式庫 <br>
Socket.IO 主要是好在，可以自動降級到其他傳輸方式! <br>

###開啟方式<br>
01.定位到app.js所在目錄 cd app.js所在目錄<br>
02.輸入 node app.js 啟動Server => 終端機印出 app listen at 8080，則表示Server啟動成功！<br>
03.再開另一個終端，然後用npm run dev 就可以使用聊天室了！<br>


###【socket.io 提供的基本方法】
https://socket.io/docs/v3/index.html <br>
- socket.emit — 用於發送事件，接收2參數 => (事件名稱、資料們)
- socket.on — 用於監聽事件，接收2參數 => (事件名稱、回調函式)
- io.sockets.emit — Server對所有連接的Client發送事件
- socket.broadcast.emit — Client給自己以外的Client發送事件



參考資料：
https://socket.io/ <br>
https://viboloveyou12.medium.com/%E7%94%A8-socket-io-%E6%89%93%E9%80%A0%E5%A4%9A%E4%BA%BA%E8%81%8A%E5%A4%A9%E5%AE%A4-%E4%B8%8A-e601f411d2a7 <br>
https://sbcode.net/threejs/socketio-setup/# <br>
https://www.bilibili.com/video/BV1th411J7zo?p=1&vd_source=6debe48d0185b1255e758e98f1436e09 <br>



