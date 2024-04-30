/* A_01.Node.js + Socket.IO建立伺服器 */
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { color } from 'three/examples/jsm/nodes/Nodes.js';

class App {
    constructor() {
        /* A.伺服器建立 */
        this.port = 3000;
        this.server = createServer();
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: ["https://gotoo.co",
                    "http://localhost:1234",
                    "http://127.0.0.1:5500",],
                methods: ["GET", "POST"],
                allowedHeaders: ["my-custom-header"],
                credentials: true
            }
        });

        /* B.客戶端追蹤 */
        this.clientList = {};
        this.roomList = {}

        /* C.當伺服器連線上時 */
        this.initServer();

    }
    initServer() {
        this.io.on('connection', (socket) => {
            console.log(`有用戶加入拉: ${socket.id}`);
            this.init(socket);
            this.roomUpdate(socket);
            this.gameUpdate(socket);
            this.leave(socket);
        });
    }
    /* 啟動伺服器 */
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}.`);
        });
    }
    init(socket) { /* 初始化 */
        /* 給客戶端ID、roomList、clientList */
        /* 生成基本數值 */
        this.constructClientList(socket.id);
        this.constructRoomsList();
        socket.emit('initPlayerSetMe', socket.id);
        this.io.emit('initPlayer', socket.id);
    }
    roomUpdate(socket) { /* 開房中 - 資料交換的方式 */
        socket.on("joinRoom", (userName, roomName) => {
            socket.join(roomName); //分房
            this.clientList[socket.id].userName = userName;
            this.clientList[socket.id].playerState = "prepare"; // 強制給新加入的玩家狀態調整成準備中

            if (!this.roomsList[roomName]) { /* 如果沒有這個房間，则新增這個房間 */
                this.roomsList[roomName] = new Set();
                this.clientList[socket.id].playerState = "ready";
            }
            this.roomsList[roomName].add(socket.id);
            console.log("新增房間名單 =>", this.roomsList);

            /* 分成兩種傳遞方式，傳給自己()和傳給其他人() */
            // 客戶端只傳遞自己的RoomList，也只傳送同房的人的詳細資訊，所以有專門的函式篩選內容
            socket.emit('RoomAnnouncement_Me', this.filterRoombyName(roomName), this.filterClientListbyRoom(roomName));
            socket.broadcast.to(roomName).emit("RoomAnnouncement", socket.id, this.filterRoombyName(roomName), this.clientList[socket.id])
            socket.broadcast.to(roomName).emit("canStartBTN", this.checkIfAllReady(roomName));
        });
        socket.on("updateSetting", (type, data) => {
            let newTypeArr;
            if (Array.isArray(type)) { //A - 做參數的歸一化
                newTypeArr = type;
            } else {
                newTypeArr = [type];
                data = data;
            }
            let roomName = Object.keys(this.roomsList).find(key => this.roomsList[key].has(socket.id)); // 取得自己在哪個房間 
            let client = this.clientList[socket.id];
            newTypeArr.forEach((elem, idx) => { //B - 改變個參數的狀態
                client[elem] = data[idx];
                switch (elem) {
                    case "playerState":
                        socket.broadcast.to(roomName).emit("canStartBTN", this.checkIfAllReady(roomName));
                        break;
                    case "color":
                        break;
                    case "size":
                        break;
                    case "pos":
                        break;
                    case "rot":
                        break;
                }
            });
            console.log("updateSetting=>", roomName, this.clientList[socket.id]);
            socket.broadcast.to(roomName).emit("takeUpdateSetting", newTypeArr, socket.id, this.clientList[socket.id]); // 只需要給和自己同房的使用者更新狀態就行
        });
        socket.on("pushStartGame", (roomName) => {
            this.io.to(roomName).emit("receiveStartGame");
        })
    }
    gameUpdate(socket) { /* 遊戲中 - 資料交換的方式 */

    }
    leave(socket) { /* 離開邏輯 - 斷線 + 自行退出 */
        /* 斷線 */
        socket.on('disconnect', () => { handleLeave(socket, "disconnect"); });
        socket.on('returnLobby', () => { handleLeave(socket, "returnLobby"); });
        const handleLeave = (socket, reason) => {
            console.log('有用戶' + reason + '=>' + socket.id);
            let leaveUserID = socket.id;
            if (reason == "disconnect") { delete this.clientList[socket.id]; };
            for (const roomName in this.roomsList) { // 遍历所有房间
                if (this.roomsList[roomName].has(socket.id)) {
                    this.roomsList[roomName].delete(socket.id);
                    socket.broadcast.to(roomName).emit("canStartBTN", this.checkIfAllReady(roomName));
                    if (this.roomsList[roomName].size === 0) {//如果房间变空了，也可以从 this.roomsList 中完全删除房间
                        delete this.roomsList[roomName];
                    } else {
                        if (reason == "returnLobby") { socket.leave(roomName) }
                        this.io.to(roomName).emit('removePlayer', leaveUserID, this.filterRoombyName(roomName), this.filterClientListbyRoom(roomName));
                    }

                }
            }

            console.log("所有客戶端 =>", this.clientList);
            console.log("所有房間 =>", this.roomsList);
        }
    }
    updateClients() {
    }
    /* 初始化房間相關 */
    convertRoomsList(roomsList) {
        const result = {};
        for (const roomName in roomsList) {
            if (roomsList.hasOwnProperty(roomName)) {
                result[roomName] = Array.from(roomsList[roomName]);
            }
        }
        return result;
    }
    constructRoomsList() { // 用于初始化 this.roomsList
        this.adapterRooms = this.io.sockets.adapter.rooms;
        this.adapterSids = this.io.sockets.adapter.sids;

        this.roomsList = {}; // 清空当前的 this.roomsList
        this.adapterRooms.forEach((value, key) => {
            if (!this.adapterSids.has(key)) { // 这表示 key 不是单独的客户端连接，而是一个房间
                this.roomsList[key] = new Set(value); // 用 Set 来保持 socket IDs 的唯一性
            }
        });
    }
    constructClientList(socketId) {
        const data = this.createPlayerValue();
        /* playerState => [ init | prepare | ready | idle | walk | run | jump | die ] */
        this.clientList[socketId] = {
            id: socketId,
            userName: '',
            playerState: 'init',
            setting: {
                color: data.color,
                size: data.size,
                pos: { x: data.posX, y: data.posY, z: data.posZ },
                rot: { x: data.rotX, y: data.rotY, z: data.rotZ }
            }
        }

    }
    createPlayerValue() { /* 建立隨機數值 */
        // Generate a random size from 1 to 5
        const size = 1 + Math.floor(Math.random() * 5);
        // Generate a random x position from -10 to 10
        const posX = Math.floor((Math.random() * 2 - 1) * 10);
        // Generate a random y position from 0 to 15
        const posY = Math.floor(0 + Math.random() * 16);
        const posZ = Math.floor((Math.random() * 2 - 1) * 10);
        const color = Math.floor(Math.random() * 0x100000).toString(16).padStart(6, '0');

        const rotX = Math.floor(Math.random() * 360 * Math.PI / 180);
        const rotY = Math.floor(Math.random() * 360 * Math.PI / 180);
        const rotZ = Math.floor(Math.random() * 360 * Math.PI / 180);
        return { size, posX, posY, posZ, color, rotX, rotY, rotZ };
    }
    /* 更新房間相關 */
    filterRoombyName(roomName) { /* 篩選出在同房間的用戶資訊 */
        let result = [];
        this.roomsList[roomName].forEach((uuid) => {
            result.push(uuid);
        });
        return result;
    }
    filterClientListbyRoom(roomName) { /* 篩選出在同房間的用戶資訊 */
        let result = {};
        if (this.roomsList[roomName]) {
            this.roomsList[roomName].forEach((uuid) => {
                if (this.clientList[uuid]) {
                    result[uuid] = this.clientList[uuid];
                }
            });
        }
        return result;
    }
    checkIfAllReady(roomName) {
        let result = true;
        this.roomsList[roomName].forEach((id) => {
            if (this.clientList[id].playerState !== 'ready') {
                result = false;
            }
        });
        return result;
    }
}

const app = new App();
app.Start();
