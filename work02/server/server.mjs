/* A_01.Node.js + Socket.IO建立伺服器 */
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

class App {
    constructor() {
        /* A.伺服器建立 */
        this.port = 3000;
        this.server = createServer();
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: ["https://gotoo.co",
                    "http://localhost:1234",
                    "http://127.0.0.1:5500",],  // 允许哪些 URL 可以访问资源
                methods: ["GET", "POST"],  // 允许哪些 HTTP 方法访问资源
                allowedHeaders: ["my-custom-header"],  // 允许哪些 HTTP 头部访问资源
                credentials: true  // 是否允许发送 Cookie
            }
        });

        /* B.客戶端追蹤 */
        // 初始化一個物件來追蹤所有連線的客戶端。 每個客戶端連線都將以其 socket.id 作為鍵儲存在這個物件中。
        // 每個鍵都會對應到時間戳記、位置、旋轉量等數據...
        this.clients = {};
        /* C.當伺服器連線上時 */
        this.initServer();

    }
    initServer() {
        this.io.on('connection', (socket) => {
            //C-1.每次有新使用者時，都會觸發 socket.id => 會自動生成一個uuid
            console.log(`有用戶加入拉: ${socket.id}`);

            //C-2.把使用者的UUid加入到clients物件中
            this.clients[socket.id] = {
                pos: null,
                rot: null,
                size: null,
                color: null,
                events: [], // 直接將當前事件加入
            };

            //C-3.設定伺服器端有一個 id 事件，發送給客戶端當前的UUid
            socket.emit('getId', socket.id, this.clients);

            //C-4.當客戶端斷掉連線時
            socket.on('disconnect', () => {
                console.log('有用戶離開: ' + socket.id);
                //C-5.把使用者的UUid從clients物件中刪除
                if (this.clients[socket.id]) {
                    console.log('刪除' + socket.id); //終端會告訴我們刪除了誰
                    delete this.clients[socket.id];
                    //給客戶端發送被刪除者的socket.id
                    this.io.emit('removeClient', socket.id);
                }
            });

            //C-6.伺服器收到客戶端給的 giveSetting 事件時，伺服器會把資料傳回來整理好，再發回給客戶端
            socket.on('giveSetting', (id, myValue) => {
                let client = this.clients[id];
                if (client) {
                    client.size = Number(myValue.size);
                    client.pos = {
                        x: Number(myValue.posX),
                        y: Number(myValue.posY),
                        z: Number(myValue.posZ)
                    };
                    client.rot = {
                        x: Number(myValue.rotX),
                        y: Number(myValue.rotY),
                        z: Number(myValue.rotZ)
                    };
                    client.color = `#${myValue.color}`;

                    // 将更新后的客户端信息保存回{}
                    this.clients[id] = client;
                    // 然后将这个更新后的客户信息广播给所有客户端
                    this.io.emit('updateClients', this.clients);
                }

                //C-7.設定伺服器端有一個 update 事件
                // socket.on('update', (message) => {
                //     if (this.clients[socket.id]) {
                //         this.clients[socket.id].t = message.t; //客戶端的時間戳記
                //         this.clients[socket.id].p = message.p; //position
                //         this.clients[socket.id].r = message.r; //rotation
                //     }
                // });
            });
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
new App().Start();
