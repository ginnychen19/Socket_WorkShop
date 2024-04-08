export class UiControl {
    constructor(main) {
        this.main = main;
        this.btn_JoinGame = $(".joinGame")[0];
    }
    init() {
        this.btn_JoinGame.onclick = () => { //加入遊戲的介面
            if (this.checkNameInput() == "") {
                alert("請輸入名字");
                return;
            } else {
                let userName = this.checkNameInput();
                alert(userName);
            }
            if (this.checkRoomidInput() == "") {
                // 自動開啟新房間，自動隨機加入
                return;
            } else {
                let RoomID = this.checkRoomidInput();

            }

            // 判斷是否有輸入名字
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