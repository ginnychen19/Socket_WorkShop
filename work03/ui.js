export class UiControl {
    constructor(main) {
        this.main = main;
        this.btn_JoinGame = $(".joinGame")[0];
        this.socket = main.socketClient.socket; 
    }
    init() {
        console.log(this.socket);

        this.btn_JoinGame.onclick = () => { //加入遊戲的介面
            let userName = this.checkNameInput();
            let RoomID = this.checkRoomidInput();
            if (userName == "") { //必填項目，沒有填就不能往下
                alert("請輸入名字");
                return;
            }
            
            if (RoomID == "") {
                // 自動開啟新房間，自動隨機加入
            } else {
                // 判斷是否有輸入名字
            }
            //開啟房間介面
            $(".Login").addClass("hidden");
            $(".OpenHouse").removeClass("hidden");

        }
    }
    update() {

    }

    checkNameInput() {  /* 檢查是否有寫名字 => 有的話返回值，沒有的話返回空白 */
        let userName = document.getElementById("userName").value.trim();
        return userName;
    }
    checkRoomidInput() { /* 檢查是否有輸入房號 */
        let Roomid = document.getElementById("userName").value.trim();
        return Roomid;
    }

}