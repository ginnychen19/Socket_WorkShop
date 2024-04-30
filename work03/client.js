import { io } from 'socket.io-client';//npm i --save-dev socket.io-client

export class Client {
    constructor(main) {
        this.main = main;
        /* 只會收和自己同一房間的 */
        this.MyRoomMates = []; //放ID
        this.MyMatesList = {}; //放詳細資訊

        this.socket = io('ws://localhost:3000');
        this.socket.on("connect", () => {
            console.log("connected");
        })

        this.createSocket();
    }
    createSocket() {
        this.socket.once("initPlayerSetMe", (id) => {
            console.log("我是本地用戶", id);
        })
        this.socket.on("initPlayer", (id) => {
            console.log("有玩家加入拉", id);
        })
    }
    joinRoom(userName, roomID) { //從UI.js調用
        this.socket.emit("joinRoom", userName, roomID);
    }
    RoomAnnouncement() { //從UI.js調用
        this.socket.on("RoomAnnouncement_Me", (MyMatesID, MyMatesValue) => {
            console.log("【RoomAnnouncement_Me】我自己收消息拉", MyMatesID, MyMatesValue);
            /* MyMatesID    => 本人當前房間有哪些室友
               MyMatesValue => 本人當前房間所有室友的詳細資料 */
            let needInitUI = MyMatesID.length > 1 ? true : false
            this.main.UiControl.openRoom('Init', { needInitUI, MyMatesID, MyMatesValue })//把介面處理丟到UI.js
            this.MyRoomMates = MyMatesID;
            this.MyMatesList = MyMatesValue;
        })
        this.socket.on("RoomAnnouncement", (id, MyMatesID, newMatesValue) => {
            console.log("【RoomAnnouncement】室友收消息拉", MyMatesID, newMatesValue);
            /* id            => 新人的ID
               MyMatesID     => 更新室友名單
               newMatesValue => 新人的詳細資料 */
            this.main.UiControl.openRoom('update', { newMatesValue })//把介面處理丟到UI.js
            this.MyRoomMates = MyMatesID;
            this.MyMatesList[id] = newMatesValue; //直接加入新人
        })
    }
    leaveRoom() { //從UI.js調用
        this.socket.on("removePlayer", (id, MyMatesID, MyMatesValue) => {
            /* id           => 離去的人的ID
               MyMatesID    => 本人當前房間有哪些室友
               MyMatesValue => 本人當前房間所有室友的詳細資料  */
            console.log("【removePlayer】有玩家離開了=>", id, MyMatesID, MyMatesValue);
            this.main.UiControl.openRoom('delete', { MyMatesID, MyMatesValue })
            this.MyRoomMates = MyMatesID;
            this.MyMatesList = MyMatesValue;

        });
    }
    returnRoomBtn() { //從UI.js調用
        this.socket.emit("returnLobby", this.socket.id);
    }
    checkStateTo(type, data) {  //從UI.js調用 => 客戶端改變狀態，並傳送給伺服器 
        /*  newType = [可以是 "playerState" | "color" | "size" | "pos" | "rot" ]
            data    = [ 各自的狀態更新 ]  */
        let newTypeArr;
        if (Array.isArray(type)) { //A - 做參數的歸一化
            newTypeArr = type;
        } else {
            newTypeArr = [type];
            data = [data];
        }
        let client = this.MyMatesList[this.socket.id];
        newTypeArr.forEach((elem, idx) => { //B - 改變個參數的狀態
            client[elem] = data[idx];
            switch (elem) {
                case "playerState":
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
        console.log("updateSetting=>", this.MyMatesList[this.socket.id]);
        this.socket.emit("updateSetting", type, data);
    }
    /**
     * 從UI.js調用 => 接收伺服器端更新某一個玩家的資訊，在這裡執行相應操作
     */
    receiveSetting() {
        this.socket.on("takeUpdateSetting", (types, id, newMatesValue) => {
            this.MyMatesList[id] = newMatesValue; //先更新該玩家數據
            console.log("【takeUpdateSetting】=>", id, newMatesValue);
            types.forEach((elem, idx) => { // 根據改動內容來更新UI情況
                switch (elem) {
                    case "playerState":
                        let whichPlayer = parseInt(this.MyRoomMates.indexOf(id)) + 1;
                        let readyStatus = this.main.UiControl.ConvertStateToText(newMatesValue.playerState);
                        $(`#userList>li:nth-of-type(${whichPlayer})>#PutUserStatus`).text(readyStatus);
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
        })

        this.socket.on("canStartBTN", (bool) => {
            if (this.MyRoomMates[0] === this.socket.id) {
                $(".startGame").prop("disabled", !bool);
            }
        })
    }
    updateSocket() {
    }
    /* 初始化 */
    // createOrUpdateBlock(clients) {
    //     Object.entries(clients).forEach(([id, client]) => { // 這裡會跑每一個client
    //         if (!(id in this.clientCubes)) { // 如果方块不存在，则创建
    //             const geometry = new THREE.BoxGeometry(client.size, client.size, client.size);
    //             const material = new THREE.MeshBasicMaterial({ color: client.color });
    //             const cube = new THREE.Mesh(geometry, material);
    //             cube.position.set(client.pos.x, client.pos.y, client.pos.z);
    //             cube.rotation.set(client.rot.x, client.rot.y, client.rot.z);
    //             this.scene.add(cube);
    //             this.clientCubes[id] = cube;
    //         } else { // 如果方块存在，更新方块的位置和旋转
    //             this.clientCubes[id].position.set(client.pos.x, client.pos.y, client.pos.z);
    //             this.clientCubes[id].rotation.set(client.rot.x, client.rot.y, client.rot.z);
    //         }
    //     });
    //     console.log([this.clientCubes]);
    // }
    // removeBlock(userId) {
    //     const block = this.blocks[userId];
    //     if (block) {
    //         this.scene.remove(block); // 从场景中移除方块
    //         delete this.blocks[userId]; // 从 blocks 对象中删除引用
    //     }
    // }
    // createPlayer() {
    //     // this.player = new Player(this, this.Input, this.camera);
    //     // this.player.init();
    // }
}