/* A_01.Node.js + Socket.IO建立伺服器 */
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const port = 3000;
class App {
    constructor(port) {
        /* A.伺服器建立 */
        this.port = port;
        
        this.server = createServer();
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: "http://localhost:1234",
                methods: ["GET", "POST"],
                allowedHeaders: ["my-custom-header"],
                credentials: true  // 是否允许发送 Cookie
            }
        });

        /* B.客戶端追蹤 */
        // 初始化一個物件來追蹤所有連線的客戶端。 每個客戶端連線都將以其 socket.id 作為鍵儲存在這個物件中。
        // 每個鍵都會對應到時間戳記、位置、旋轉量等數據...
        this.clients = {};
        /* C.當伺服器連線上時 */
        this.initServer();
        /* D.因為只要有人移動，伺服器端就要一直通知有數值被更新了，讓客戶端一直畫新位置 */
        // this.updateClients();
    }
    initServer() {
        this.io.on('connection', (socket) => {
            //C-1.每次有新使用者時，都會觸發 socket.id => 會自動生成一個uuid
            console.log(`有用戶加入拉: ${socket.id}`);
            socket.emit("connection-successful", "連接成功");
            //C-2.把使用者的UUid加入到clients物件中
            this.clients[socket.id] = {};

            //C-3.設定伺服器端有一個 id 事件，發送給客戶端當前的UUid
            socket.emit('getId', socket.id);
            
            //C-4.當客戶端斷掉連線時
            socket.on('disconnect', () => {
                console.log('有用戶離開: ' + socket.id);
                //C-5.把使用者的UUid從clients物件中刪除
                if (this.clients && this.clients[socket.id]) {
                    console.log('刪除' + socket.id); //終端會告訴我們刪除了誰
                    delete this.clients[socket.id];
                    //給客戶端發送被刪除者的socket.id
                    // this.io.emit('removeClient', socket.id);
                }
            });

            socket.on('iamfromClient', (message) => {
                console.log(message);
            })
            // //C-6.設定伺服器端有一個 update 事件
            // socket.on('update', (message) => {
            //     if (this.clients[socket.id]) {
            //         this.clients[socket.id].t = message.t; //客戶端的時間戳記
            //         this.clients[socket.id].p = message.p; //position
            //         this.clients[socket.id].r = message.r; //rotation
            //     }
            // });
        });
    }
    updateClients() {
        setInterval(() => {
            this.io.emit('clients', this.clients);
        }, 50);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
}
new App(port).Start();
