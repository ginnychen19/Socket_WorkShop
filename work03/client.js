import { io } from 'socket.io-client';//npm i --save-dev socket.io-client

export class Client {
    constructor(main) {
        this.main = main;
        this.socket = io('ws://localhost:3000');
        this.socket.on("connect", () => {
            console.log("connected");
        })
        this.socket.on("disconnect", () => {
            console.log("disconnected");
        })
    }
    createSocket() {
        // D-3.socket 收到 伺服器的 id 事件，生成第一個方塊(自己)
        this.socket.on('getId', (id, AllPlayers) => {
            console.log("這位玩家是:", id);
            console.log("伺服器的玩家資料:", AllPlayers);
            //D-4.socket id後，開始製作方塊
            let myValue = this.createMyBoxValue();
            this.socket.emit("giveSetting", id, myValue);
        });
        // D-5.socket 收到 removeClient 也就是有玩家退出的事件
        this.socket.on('removeClient', (id) => {
            console.log("有用戶離開:", id);
            delete this.clients[id];
            // 刪除實際方塊玩家的邏輯
            this.scene.remove(this.clientCubes[id]);
        })
        /* 把所有伺服器的玩家一起更新進來 */
        this.socket.on('updateClients', (allClients) => {
            this.clients = allClients;
            console.log("客戶端收到的總人數資料:", this.clients);
            //D-4.伺服器收完資料後後，開始製作方塊
            this.createOrUpdateBlock(this.clients);
        });
    }
    updateSocket() {

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
    createOrUpdateBlock(clients) {
        Object.entries(clients).forEach(([id, client]) => { // 這裡會跑每一個client
            if (!(id in this.clientCubes)) { // 如果方块不存在，则创建
                const geometry = new THREE.BoxGeometry(client.size, client.size, client.size);
                const material = new THREE.MeshBasicMaterial({ color: client.color });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.set(client.pos.x, client.pos.y, client.pos.z);
                cube.rotation.set(client.rot.x, client.rot.y, client.rot.z);
                this.scene.add(cube);
                this.clientCubes[id] = cube;
            } else { // 如果方块存在，更新方块的位置和旋转
                this.clientCubes[id].position.set(client.pos.x, client.pos.y, client.pos.z);
                this.clientCubes[id].rotation.set(client.rot.x, client.rot.y, client.rot.z);
            }
        });
        console.log([this.clientCubes]);
    }
    removeBlock(userId) {
        const block = this.blocks[userId];
        if (block) {
            this.scene.remove(block); // 从场景中移除方块
            delete this.blocks[userId]; // 从 blocks 对象中删除引用
        }
    }
    createPlayer() {
        this.player = new Player(this, this.Input, this.camera);
        this.player.init();
    }
}