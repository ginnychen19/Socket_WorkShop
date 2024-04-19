import { io } from 'socket.io-client';

export class Client {
    constructor(main) {
        this.main = main;
        this.clientME = {}; //記錄自己是誰，和自己的資料
        this.clients = {};  //所有的客戶端
        this.socket = io('ws://localhost:8080');
        this.roomsList = {} //當前的房間，會一直和server端同步

        this.socketInit();
    }
    socketInit() {
        this.socket.on("connect", () => {
            console.log("connected");

            /* 每次有連結加入，這邊都會呼叫一次 */
            this.socket.once('onInitSetME', (id) => {
                this.clientME.uuid = id;
                $("#myID").text("我的ID為：" + id);
            })
            this.socket.on('onInit', (id, roomsList, clientList) => {
                console.log("有新用戶加入拉" + id);
                this.checkRoomList(roomsList, clientList);
            });
             // this.socket.off("SBjoin");
            // this.socket.on("SBjoin", (data) => { //我是舊客戶端，要丟資訊給新客戶端
            //     console.log("我是舊客戶端，要丟資訊給新客戶端");
            //     console.log(data);
            //     this.socket.emit("giveData", this.clientME);
            // });
            // this.socket.on("initRoom", (data) => {
            //     console.log("取得所有已存在的客戶端");
            //     console.log(data);
            // });

            this.afterConnectSocket();
        })
        this.socket.on("disconnect", () => {
            console.log("disconnected");
        })
    }
    afterConnectSocket() {
        this.clickjoinRoom();
    }
    clickjoinRoom() {
        $("#join").on("click", () => {
            const userName = $("#userName").val();
            const roomName = $("#RoomName").val();
            this.clientME.userName = userName;
            this.socket.emit('join-room', userName, roomName);
            /* 直接改成全部都對照最新發來的 roomList 用html的方式重改 */

            this.socket.on("Room-announcement", (id, userName, roomName, roomsList) => {
                console.log(id + "有人加入房間");
                // 對比this.roomsList的key 與 roomsList的key
                const server_roomKeys = Object.keys(roomsList);
                const client_roomKeys = Object.keys(this.roomsList);
                // 比較server端與client端的房間名單，得出兩個陣列的差異值 
                const difference = server_roomKeys
                    .filter(x => !client_roomKeys.includes(x))
                    .concat(client_roomKeys.filter(x => !server_roomKeys.includes(x)));
                if (difference.length > 0) { //有新增的房間
                    // console.log("有新增的房間:", difference);
                    // 看當前的房間名稱是否已存在於UI中
                    const roomUIExist = $(".roomName").filter((idx, elem) => {
                        return $(elem).text() === roomName;
                    }).length > 0;

                    if (!roomUIExist) {
                        $(".roomUsers").append(`<div class="room"><h2>房間<span class="roomName">${roomName}</span></h2><div class="userList"><p class="player">${userName}</p></div></div>`)
                    } else {
                        // console.log("房間已存在");
                        $(".roomName").each((idx, elem) => {
                            if ($(elem).text() == roomName) {
                                console.log($(elem).parent());
                                $(elem).parent().parent().find(".userList").append(`<p class="player">${userName}</p>`)
                            }
                        });
                    }
                } else { //沒有新增的房間 那大概就是有人加入了房間
                    console.log("沒有新增的房間");
                    $(".roomName").each((idx, elem) => {
                        if ($(elem).text() == roomName) {
                            console.log($(elem).parent());
                            $(elem).parent().parent().find(".userList").append(`<p class="player">${userName}</p>`)
                        }
                    });
                }

                //在這裡判斷是需要開新房間加入還是直接加入房間
                this.roomsList = roomsList; // 都做完了在更新this.roomsList的資料 
            })
        })
    }
    checkRoomList(roomsList, clientList) {
        // 比較server端與client端的房間名單，得出兩個陣列的差異值 
        const difference = Object.keys(roomsList)
            .filter(x => !Object.keys(clientList).includes(x))
            .concat(Object.keys(clientList).filter(x => !Object.keys(roomsList).includes(x)));

        if (difference.length > 0) { //有新增的房間
            // console.log("有新增的房間:", difference);
            // 看當前的房間名稱是否已存在於UI中
            const roomUIExist = $(".roomName").filter((idx, elem) => {
                return $(elem).text() === roomName;
            }).length > 0;

            if (!roomUIExist) {
                $(".roomUsers").append(`<div class="room"><h2>房間<span class="roomName">${roomName}</span></h2><div class="userList"><p class="player">${userName}</p></div></div>`)
            } else {
                // console.log("房間已存在");
                $(".roomName").each((idx, elem) => {
                    if ($(elem).text() == roomName) {
                        console.log($(elem).parent());
                        $(elem).parent().parent().find(".userList").append(`<p class="player">${userName}</p>`)
                    }
                });
            }
        } else { //沒有新增的房間 那大概就是有人加入了房間
            console.log("沒有新增的房間");
            $(".roomName").each((idx, elem) => {
                if ($(elem).text() == roomName) {
                    console.log($(elem).parent());
                    $(elem).parent().parent().find(".userList").append(`<p class="player">${userName}</p>`)
                }
            });
        }
    }
    createSocket() {
    }
    updateSocket() {
    }

}

const client = new Client();