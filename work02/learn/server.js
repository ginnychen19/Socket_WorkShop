// 當使用 `npm run dev` 啟動此專案時，此伺服器腳本
// 將使用 tsc 進行編譯，並與 webpack-dev-server 同時執行。
// 瀏覽 http://127.0.0.1:8080
// 在生產環境中，我們不使用 webpack-dev-server，因此請鍵入
// `npm run build`       （這將建立生產版本的 bundle.js，並將其放置在 ./dist/client/ 中。）
// `tsc -p ./src/server` （將 ./src/server/server.ts 編譯為 ./dist/server/server.js）
// `npm start`           （這將使用 express 啟動 nodejs 並為 ./dist/client 資料夾提供服務）
// 瀏覽 http://127.0.0.1:3000
import express from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
const port = 3000;
class App {
    constructor(port) {
        /* A.客戶端追蹤 */
        // 初始化一個物件來追蹤所有連線的客戶端。 每個客戶端連線都將以其 socket.id 作為鍵儲存在這個物件中。
        this.clients = {};

        /* B.伺服器建立 */
        this.port = port;
        const app = express();
        app.use(express.static(path.join(__dirname, '../client'))); //路由設定， 使用時，因為express會設定要取用物件的路徑，所以我設定時，要符合我用parcel打包的路徑
        this.server = new http.Server(app);
        this.io = new Server(this.server);

        /* C.當伺服器連線上時 */
        this.io.on('connection', (socket) => {
            //C-1.在終端宣告有一個socket被建立了
            console.log(socket.constructor.name);

            //C-2.把使用者的UUid加入到clients物件中
            this.clients[socket.id] = {};
            console.log(this.clients);
            console.log('a user connected : ' + socket.id);

            //C-3.設定伺服器端有一個 id 事件
            socket.emit('id', socket.id);
            //C-4.當客戶端斷掉連線時
            socket.on('disconnect', () => {
                console.log('socket disconnected : ' + socket.id);

                //C-5.把使用者的UUid從clients物件中刪除
                if (this.clients && this.clients[socket.id]) {
                    console.log('deleting ' + socket.id); //終端會告訴我們刪除了誰
                    delete this.clients[socket.id];
                    //給客戶端發送被刪除者的socket.id
                    this.io.emit('removeClient', socket.id);
                }
            });
            //C-6.設定伺服器端有一個 update 事件
            socket.on('update', (message) => {
                if (this.clients[socket.id]) {
                    this.clients[socket.id].t = message.t; //客戶端的時間戳記
                    this.clients[socket.id].p = message.p; //position
                    this.clients[socket.id].r = message.r; //rotation
                }
            });
        });
        setInterval(() => {
            this.io.emit('clients', this.clients);
        }, 50);
        /* 因為只要有人移動，伺服器端就要一直通知有數值被更新了，讓客戶端一直畫新位置 */
        /* 可以再思考看看 有人移動才呼叫系統要通知  */
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();

/*  A.對於每個新連接：
    它的 socket.id 被用來在 this.clients 物件中追蹤該客戶端。
    向該客戶端發送所有人的 socket.id。

    設定監聽該客戶端的 'disconnect' 事件，以便在客戶端斷開連線時從 this.clients 中移除該客戶端。
    設定監聽該客戶端的 'update' 事件，以便更新該客戶端的狀態（如時間戳記、位置和旋轉）。
    定期廣播: 使用 setInterval 定期向所有用戶端廣播目前所有用戶端的狀態。
*/

/*  B.有任何客戶端移動才呼叫系統要通知

    // 那就是基于事件的通信而不是定时广播。这种方法可以减少不必要的网络流量和服务器负载，因为它仅在有实际变化时才发送数据。
    // 在这种模式下，客户端只在用户的状态（如位置或旋转）发生变化时向服务器发送消息。
    // 然后，服务器接收到这些变化后，将更新广播给所有其他客户端。

    // 客户端
    // 当用户执行某些操作（如移动或旋转）时，客户端应发送一个包含新状态的消息给服务器：

    // 假设用户执行了移动操作，此函数被调用
    function onUserMove(newPosition) {
        // 向服务器发送新的位置信息
        socket.emit('updatePosition', { id: socket.id, position: newPosition });
    }

    // 服务器端
    // 服务器监听来自客户端的消息，然后将更新广播给其他所有客户端：
    // server.mjs
    io.on('connection', (socket) => {
        // 用户连接的其他逻辑...

        socket.on('updatePosition', (data) => {
            // 更新服务器上该用户的位置
            if (this.clients[data.id]) {
                this.clients[data.id].p = data.position;
            }

            // 广播这个变化给所有其他客户端
            socket.broadcast.emit('positionUpdated', data);
        });

        // 用户断开连接的其他逻辑...
    });

    // 客户端
    // 客户端监听来自服务器的更新位置的广播，并相应地更新显示

    socket.on('positionUpdated', (data) => {
        // 更新该用户的位置信息
        updatePosition(data.id, data.position);
    });
*/
