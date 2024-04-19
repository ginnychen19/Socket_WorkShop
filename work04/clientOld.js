import { io } from 'socket.io-client';

const socket = io('http://localhost:8080');
var player;
socket.on("connect", () => {
    console.log("connected");
    /* 01.取得當前客戶端的ID + 02.取得當前有哪些房間 + 03.取得當前有哪些人 */
    socket.on('onInit', (id, rooms, players) => {
        player = id;
        $("#myID").text("我的ID為：" + id);
        console.log(id);
        console.log(rooms);
        console.log(players);
        // 如果 rooms 不為空(可能已經有其他人加入了)，則將當前房間加入到 rooms 中
        if (Object.keys(rooms).length) {
            Object.keys(rooms).forEach(room => {
                $('.roomUsers').append('<div class="room"><h2>房間<span class="roomName">' + room + '</span></h2><div class="userList"></div></div>');
                rooms[room].forEach(player => {
                    $(".roomName").each((idx, elem) => {
                        if ($(elem).text() == room) {
                            $(elem).parent().parent().find(".userList").append('<p class="player">' + player + '</p>');
                        }
                    })
                })
            })
        }
    });
});
socket.on("disconnect", () => {
    console.log("disconnected");
})

//點擊加入按鈕
$("#join").click(() => {
    const roomName = $("#RoomName").val().trim();
    if (roomName == "") {
        alert("請輸入房間名稱!");
        return;
    }
    // UI- 加入房間的前端介面
    const isExist = $(".roomName").toArray().some(elem => $(elem).text() === roomName);
    if (!isExist) { // 如果房間不存在，則加入新房間區塊和加入玩家
        $('.roomUsers').append('<div class="room"><h2>房間<span class="roomName">' + roomName + '</span></h2><div class="userList"></div></div>');
        $(".roomName").each((idx, elem) => {
            if ($(elem).text() == roomName) {
                $(elem).parent().parent().find(".userList").append('<p class="player">' + player + '</p>');
            }
        })
    } else { // 如果房間存在，直接加入玩家就行
        $(".roomName").each((idx, elem) => {
            if ($(elem).text() == roomName) {
                $(elem).parent().parent().find(".userList").append('<p class="player">' + player + '</p>');
            }
        })
    }
    // Socket- 把使用者到某房間的介面記錄起來
    joinRoom(roomName);
});

function joinRoom(roomName) {// 加入房间的函数
    //如果该房间不存在，则创建一个新的房间。将用户加入指定的房间，并向房间内的其他用户广播新用户加入的消息。
    socket.emit('join-room', roomName);
}

function leaveRoom(roomName) {// 离开房间的函数
    socket.emit('leave-room', roomName);
}

// 监听房间中其他用户加入的事件
socket.on('user-joined', (userId, users) => {
    console.log(`用户 ${userId} 加入了房间`);
    updateRoomUsers(users);
});

// 监听房间中其他用户离开的事件
socket.on('user-left', (userId, users) => {
    console.log(`用户 ${userId} 离开了房间`);
    updateRoomUsers(users);
});

/*  */
socket.on('updateRoomPlayer', (id, roomName) => {
    $(".roomName").each((idx, elem) => {
        if ($(elem).text() == roomName) {
            $(elem).parent().parent().find(".userList").append('<p class="player">' + id + '</p>');
        }
    })
})
/* 有其他玩家加入更新所有內容 */
socket.on('updatePlayers', (rooms) => {
    console.log(rooms);//收到有多少房間
    Object.keys(rooms).forEach(room => {
        rooms[room].forEach(player => {
            $(".roomName").each((idx, elem) => {
                if ($(elem).text() == room) {
                    $(elem).parent().parent().find(".userList").append('<p class="player">' + player + '</p>');
                }
            })
        })
    })
});

// 发送消息到房间的函数
function sendMessageToRoom(roomName, message) {
    socket.emit('room-message', roomName, message);
}

// 监听房间的消息
socket.on('message', message => {
    console.log('收到房间消息:', message);
});

// 更新房间用户列表的函数
function updateRoomUsers(users) {
    // 处理用户列表的逻辑
    console.log('更新房间用户列表:', users);
}
