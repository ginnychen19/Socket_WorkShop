export class UiControl {
    constructor(main) {
        this.main = main;
        this.Client = main.socketClient;
        this.socket = main.socketClient.socket;
    }
    init() {
        const dialog = this.dialog();
        $(".joinGame")[0].onclick = () => { // 加入遊戲
            let userName = document.getElementById("userName").value.trim();
            let roomName = document.getElementById("roomID").value.trim();
            if (userName == "") {
                this.dialog().openDialog({ msg: "請輸入名字!" });
                return;
            }
            if (roomName == "") {// 自動開啟新房間，自動隨機加入
                roomName = this.generateUUid(5);  // 生成長度為5的隨機 ID
            }
            this.Client.joinRoom(userName, roomName);
            //開啟房間介面
            $("#PutroomID").text(roomName);
            $(".Login").addClass("hidden");
            $(".OpenHouse").removeClass("hidden");
        }
        this.Client.RoomAnnouncement();
        $(".returnLogin")[0].onclick = () => { // 返回登入介面
            $(".Login").removeClass("hidden");
            $(".OpenHouse").addClass("hidden");
            this.Client.returnRoomBtn(this.socket.id);
        }
        this.Client.leaveRoom();
        $(".readyGame")[0].onclick = () => { // 改變準備狀態，客戶端會優先更新自己
            // 先取得這個客戶端的使用狀態 prepare | ready
            let whichPlayer = parseInt(this.Client.MyRoomMates.indexOf(this.socket.id)) + 1;
            let readyStatus = this.Client.MyMatesList[this.socket.id].playerState;
            switch (readyStatus) {
                case "prepare":
                    readyStatus = "ready";
                    this.Client.checkStateTo("playerState", "ready")
                    $(".readyGame").toggleClass("prepared");
                    break;
                case "ready":
                    readyStatus = "prepare";
                    this.Client.checkStateTo("playerState", "prepare")
                    $(".readyGame").toggleClass("prepared");
                    break;
            }
            $(`#userList>li:nth-of-type(${whichPlayer})>#PutUserStatus`).text(this.ConvertStateToText(readyStatus));
        }
        this.Client.receiveSetting(); // 同房其他玩家，接收更新過的設定，還有是否可以開始遊戲

        $(".startGame")[0].onclick = () => { // 開始遊戲
            let roomName = $("#PutroomID").text().trim();
            console.log("【startGame】=>", roomName);
            this.socket.emit("pushStartGame", roomName);
        }
        this.socket.on("receiveStartGame", () => {
            $(".UI").addClass("hidden");
            this.main.animate();
        })
    }
    update() {

    }
    generateUUid(length = 5) { /* 生成隨機房號，可能性是62^5 */
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    openRoom(type, data) { /* 開啟房間介面 */
        console.log("【openRoom】=>", type, data);
        switch (type) {
            case "Init":// { needInitUI, MyMatesID, MyMatesValue }
                if (!data.needInitUI) { //表示是第一位玩家 => 開房按鈕
                    $(".readyGame").addClass("hidden");
                    $(".startGame").removeClass("hidden");
                } else { //表示不是第一位玩家 => 準備按鈕
                    $(".startGame").addClass("hidden");
                    $(".readyGame").removeClass("hidden");
                }
                $("#userList").empty();
                for (let idx in data.MyMatesID) { // 顯示其他玩家
                    let id = data.MyMatesID[idx];
                    let playerName = data.MyMatesValue[id].userName;
                    let playerState = this.ConvertStateToText(data.MyMatesValue[id].playerState);
                    $("#userList").append(
                        `<li>
                            <span id="PutUserName">${playerName}</span>
                            <span id="PutUserStatus">${playerState}</span>
                        </li>`
                    );
                    if (idx == 0) { $("#PutUserStatus").text("房主大大"); }
                }
                break;
            case "update": // { newMatesValue }
                let playerName = data.newMatesValue.userName;
                let playerState = this.ConvertStateToText(data.newMatesValue.playerState);
                $("#userList").append(
                    `<li>
                        <span id="PutUserName">${playerName}</span>
                        <span id="PutUserStatus">${playerState}</span>
                    </li>`
                );
                break;
            case "delete": // { MyMatesID, MyMatesValue }
                let isFirstPlayer = data.MyMatesID.indexOf(this.socket.id) === 0;
                if (isFirstPlayer) {
                    $(".readyGame").addClass("hidden");
                    $(".startGame").removeClass("hidden")
                } else {
                    $(".startGame").addClass("hidden");
                    $(".readyGame").removeClass("hidden")
                }
                $("#userList").empty();
                for (let idx in data.MyMatesID) {
                    let id = data.MyMatesID[idx];
                    let playerName = data.MyMatesValue[id].userName;
                    let playerState = this.ConvertStateToText(data.MyMatesValue[id].playerState);
                    $("#userList").append(
                        `<li>
                        <span id="PutUserName">${playerName}</span>
                        <span id="PutUserStatus">${playerState}</span>
                    </li>`
                    );
                    if (idx == 0) { $("#PutUserStatus").text("房主大大"); }
                }
                break;
            default:
                alert("未知狀態!");
                break;
        }
    }
    dialog(data) { /* 提供訊息提示 */
        /* 訊息開啟邏輯 */
        let openDialog = (data) => {
            $('#remindText').text(data.msg);
            $('.dialog').removeClass("hidden");
            $('.dialogBox').addClass("ani_zoomIN");
        }
        let closeDialog = () => {
            $('.dialogBox').addClass("ani_zoomOUT");
        }
        $('.dialogBox').on("animationend", (e) => {
            if ($(e.target).hasClass("ani_zoomIN")) {
                $(e.target).removeClass("ani_zoomIN");
            } else if ($(e.target).hasClass("ani_zoomOUT")) {
                $('.dialog').toggleClass("hidden");
                $(e.target).removeClass("ani_zoomOUT");
            }
        });


        /* 訊息關閉監聽 */
        $('.dialog').on("click", (e) => {
            if (e.target == $('.dialog')[0] || e.target == $('.btn.close')[0]) {
                closeDialog();
            }
        });
        return { openDialog, closeDialog }
    }
    ConvertStateToText(state) {
        switch (state) {
            case "init":
                return "初始化";
            case "prepare":
                return "準備中";
            case "ready":
                return "已準備";
            default:
                return "未知狀態";
        }
    }

}