import { io } from 'socket.io-client';

export class Client {
    constructor(main) {
        this.main = main;

        this.clients = {};  //所有的客戶端
        this.socket = io('ws://localhost:8080');
        this.roomsList = {} //當前的房間，會一直和server端同步

        this.socketInit();
    }
    socketInit() {
        this.socket.on("connect", () => {
            console.log("connected");

            this.socket.once('onInitSetME', (id) => {
                $("#myID").text("本ID：" + id);
            })
            this.socket.on('onInit', (id, roomsList, clientList) => {
                console.log("有新用戶加入拉" + id);

                this.roomsList = roomsList;
                this.clients = clientList;
                if (Object.keys(roomsList).length > 0) { this.checkRoomList("init", { roomsList }); }
            });
            this.afterConnectSocket();
        })
        this.socket.on("disconnect", () => {
            console.log("disconnected");
        })
        this.socket.on("removeRoom", (id, room, needRemoveRoom, roomsList, clientList) => {
            console.log(id + "離開房間(leaveRoom)");
            this.deletRoom(id, room, needRemoveRoom);

            this.roomsList = roomsList;
            this.clients = clientList;
        });
    }
    afterConnectSocket() {
        this.clickjoinRoom();
    }
    clickjoinRoom() {
        const dialogFuntion = this.dialog();

        $("#join").on("click", () => {
            const userName = $("#userName").val().replace(/\s/g, '');
            const roomName = $("#RoomName").val().replace(/\s/g, '');
        
            if (this.ifUserJoinSomeRoom({ userName, roomName }) == true) { //已經加入過了!
                dialogFuntion.openDialog({ msg: "已經加入過了!" })
                return;
            } else {
                this.socket.emit('join-room', userName, roomName);
                this.clients[this.socket.id].userName = userName;
            }

            this.socket.off("Room-announcement"); //在click事件中添加on事件監聽的話可能會被重複綁定
            this.socket.on("Room-announcement", (id, userName, roomName, roomsList) => {
                this.checkRoomList("update", { id, userName, roomName, roomsList });
                this.roomsList = roomsList; // 都做完了在更新this.roomsList的資料 
                console.log(id + "加入房間(Room-announcement)，最新的房間列表 ⤵", this.roomsList);
            })
        })
    }

    checkRoomList(type, data) { //有新的人加入連線時都會執行一次
        console.log("【需要checkRoomList】,type:", type);

        switch (type) {
            case "init":
                if ($(".roomName").length > 0) { console.log("舊客戶端，不需要做任何更動"); return; }
                //直接針對server端的房間加入房間
                Object.keys(data.roomsList).forEach((roomKey) => {
                    // roomKey => Key 、 roomsList[roomKey] => 用戶
                    $(".roomUsers").append(`<div class="room"><h2>房間-<span class="roomName">${roomKey}</span></h2><div class="userList"></div></div>`)

                    data.roomsList[roomKey].forEach((user) => {
                        let userName = this.clients[user].userName;// 用 user id 去找到對應的 user 名稱
                        $(`.roomName:contains(${roomKey})`).parent().parent().find(".userList").append(`<p class="player">${userName}</p>`)
                    })
                })
                break;
            case "update":
                // 在連接已存在的情況下，有人更新了房間 (從Room-announcement時呼叫)
                const server_roomKeys = Object.keys(data.roomsList);
                const client_roomKeys = Object.keys(this.roomsList);
                // 比較server端與client端的房間名單，得出兩個陣列的差異值 (只會比較出Room)
                let difference = server_roomKeys
                    .filter(x => !client_roomKeys.includes(x))
                    .concat(client_roomKeys.filter(x => !server_roomKeys.includes(x)));

                if (difference.length > 0) { //有新增的房間
                    // 看當前的房間名稱是否已存在於UI中
                    const roomUIExist = $(".roomName").filter((idx, elem) => {
                        return $(elem).text() === data.roomName;
                    }).length > 0;

                    if (!roomUIExist) {
                        $(".roomUsers").append(`<div class="room"><h2>房間-<span class="roomName">${data.roomName}</span></h2><div class="userList"><p class="player">${data.userName}</p></div></div>`)
                    } else {
                        $(`.roomName:contains(${data.roomName})`).parent().parent().find(".userList").append(`<p class="player">${data.userName}</p>`)
                    }
                } else { //沒有新增的房間，那就是有人加入了某房間
                    console.log("沒有新增的房間(Room-announcement)");
                    $(".roomName").each((idx, elem) => {
                        if ($(elem).text() == data.roomName) {
                            $(elem).parent().parent().find(".userList").append(`<p class="player">${data.userName}</p>`)
                        }
                    });
                }
                break;
        }
    }
    ifUserJoinSomeRoom(data) { /* 檢查是否某人已存在某房間 */ //但注意，這種寫法不可以有重複名稱的使用者
        let Boolean = false;
        const userList = $(`.roomName:contains(${data.roomName})`).parent().parent().find(".userList").children();
        userList.each((idx, elem) => {
            if ($(elem).text() == data.userName) {
                Boolean = true;
            }
        })
        return Boolean;
    };
    deletRoom(id, room, needRemoveRoom) { //某種程度上我感覺最好還是全部重畫，因為名字有可能可以一樣
        console.log(this.clients);
        let userName = this.clients[id].userName;
        if(needRemoveRoom){
            $(`.roomName:contains(${room})`).parent().parent().remove();
        }else{
            $(`.roomName:contains(${room})`).parent().parent().find(".userList").children().each((idx, elem) => {
                if ($(elem).text() == userName) {
                    $(elem).remove();
                }
            })
        }
    }


    dialog(data) {
        $("#closeDialog").on("click", () => {
            $('dialog')[0].close();
        });
        return {
            openDialog: (data) => {
                $('dialog>#remindText').text(data.msg);
                $('dialog')[0].show();
            },
            closeDialog: () => {
                $('dialog')[0].close();
            }
        }
    }
    createSocket() {
    }
    updateSocket() {
    }

}

const client = new Client();