/* A_01.Node.js + Socket.IO建立伺服器 */
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

class App {
    constructor() {
        /* A.伺服器建立 */
        this.port = 8080;
        this.server = createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>server 正在運行！</h1>')
        });
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: ["https://gotoo.co",
                    "http://localhost:1234",
                    "http://127.0.0.1:5500",],
                methods: ["GET", "POST"],
                allowedHeaders: ["my-custom-header"],
                credentials: true  // 是否允许发送 Cookie
            }

        });

        this.clients = {};
        /* this.clients = {
            socket.id01:{ userName:"玩家名稱01",},
            socket.id02:{ userName:"玩家名稱02",}
        };*/
        this.roomsList = {};
        /* this.roomsList = {
                  roomName01:Set(2){socket.id01,socket.id02..},
                  roomName02:Set(2){socket.id03,socket.id04...}
        }*/
    }
    initServer() {
        this.io.on('connection', (socket) => {
            //每次有新使用者時，都會觸發 socket.id => 會自動生成一個uuid
            console.log(`有用戶加入拉: ${socket.id}`);
            /* 初始化房間資訊 - 取得現在有哪些房間 */
            this.constructRoomsList();
            // 設定伺服器端有一個 onInit 事件，發送給客戶端當前的UUid、房間資訊、客戶端資訊
            // 產生方塊基本數值
            let myValue = this.createMyBoxValue();
            this.clients[socket.id] = {
                uuid: socket.id,
                setting: myValue
            }
            socket.emit('onInitSetME', socket.id);//要給自己設定在客戶端保留的資料
            this.io.emit('onInit', socket.id, this.convertRoomsList(this.roomsList), this.clients);

            //當客戶端斷掉連線時
            socket.on('disconnect', () => {
                console.log('有用戶離開: ' + socket.id);
                let leaveUserID = socket.id;
                let needRemoveRoom = false;
                delete this.clients[socket.id];
                // 遍历所有房间
                for (const roomName in this.roomsList) {
                    if (this.roomsList.hasOwnProperty(roomName)) { // 如果当前断开连接的this.socket.id存在于房间中
                        if (this.roomsList[roomName].has(socket.id)) { // 从房间的 Set 中删除 this.socket.id
                            this.roomsList[roomName].delete(socket.id);
                            if (this.roomsList[roomName].size === 0) {//如果房间变空了，也可以从 this.roomsList 中完全删除房间
                                delete this.roomsList[roomName];
                                needRemoveRoom = true;
                            }
                            this.io.emit('removeRoom', leaveUserID, roomName, needRemoveRoom,this.roomsList, this.clients);
                        }
                    }
                }
                // this.io.emit('leaveRoom', socket.id, this.convertRoomsList(this.roomsList), this.clients);
                console.log(this.clients);
                console.log(this.roomsList);
            });


            //當客戶端按下加入房間按鈕時
            socket.on('join-room', (userName, roomName) => {
                socket.join(roomName);
                this.clients[socket.id].userName = userName;
                console.log(this.clients[socket.id].userName);

                if (!this.roomsList[roomName]) {
                    this.roomsList[roomName] = new Set();// 如果没有，创建一个新数组
                }
                this.roomsList[roomName].add(socket.id);

                // 广播给房间内所有客户端，包括发送者
                this.io.emit('Room-announcement', socket.id, userName, roomName, this.convertRoomsList(this.roomsList));
            })

            socket.on('leave-room', (roomName) => {
                socket.leave(roomName);
                // 如果房间没有其他用户，可以考虑从列表中移除
                // 这需要一些额外的逻辑来检查房间内是否还有用户
                // if (/* room has no more users */) {
                //     roomsList.delete(roomName);
                // }
            });
            //伺服器收到客戶端給的 giveSetting 事件時，伺服器會把資料傳回來整理好，再發回給客戶端
            // this.socket.on('giveSetting', (id, myValue) => {
            //     let client = this.clients[id];
            //     if (client) {
            //         client.size = Number(myValue.size);
            //         client.pos = {
            //             x: Number(myValue.posX),
            //             y: Number(myValue.posY),
            //             z: Number(myValue.posZ)
            //         };
            //         client.rot = {
            //             x: Number(myValue.rotX),
            //             y: Number(myValue.rotY),
            //             z: Number(myValue.rotZ)
            //         };
            //         client.color = `#${myValue.color}`;

            //         // 将更新后的客户端信息保存回{}
            //         this.clients[id] = client;
            //         // 然后将这个更新后的客户信息广播给所有客户端
            //         this.io.emit('updateClients', this.clients);
            //     }

            //     //C-7.設定伺服器端有一個 update 事件
            //     // this.socket.on('update', (message) => {
            //     //     if (this.clients[this.socket.id]) {
            //     //         this.clients[this.socket.id].t = message.t; //客戶端的時間戳記
            //     //         this.clients[this.socket.id].p = message.p; //position
            //     //         this.clients[this.socket.id].r = message.r; //rotation
            //     //     }
            //     // });
            // });
        });
    }

    updateClients() {

    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }

    // 函数将 this.roomsList 中的 Set 转换为数组
    convertRoomsList(roomsList) {
        const result = {};
        for (const roomName in roomsList) {
            if (roomsList.hasOwnProperty(roomName)) {
                result[roomName] = Array.from(roomsList[roomName]);
            }
        }
        return result;
    }

    // 构建包含所有房间和对应客户端的 this.roomsList
    constructRoomsList() {
        this.adapterRooms = this.io.sockets.adapter.rooms;
        this.adapterSids = this.io.sockets.adapter.sids;

        this.roomsList = {}; // 清空当前的 this.roomsList

        this.adapterRooms.forEach((value, key) => {
            if (!this.adapterSids.has(key)) { // 这表示 key 不是单独的客户端连接，而是一个房间
                // 用 Set 来保持 socket IDs 的唯一性
                this.roomsList[key] = new Set(value);
            }
        });
    }
    constructUsersList() {

    }
    createMyBoxValue() { /* 建立隨機數值 */
        // Generate a random size from 1 to 5
        const size = 1 + Math.floor(Math.random() * 5);
        // Generate a random x position from -10 to 10
        const posX = Math.floor((Math.random() * 2 - 1) * 10);
        // Generate a random y position from 0 to 15
        const posY = Math.floor(0 + Math.random() * 16);
        const posZ = Math.floor((Math.random() * 2 - 1) * 10);
        const color = Math.floor(Math.random() * 0x100000).toString(16).padStart(6, '0');

        const rotX = Math.floor(Math.random() * 360) * Math.PI / 180;
        const rotY = Math.floor(Math.random() * 360) * Math.PI / 180;
        const rotZ = Math.floor(Math.random() * 360) * Math.PI / 180;
        return { size, posX, posY, posZ, color, rotX, rotY, rotZ };
    }
}

const app = new App();
app.Start();
app.initServer();






