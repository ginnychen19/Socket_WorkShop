$(function () {
    /*01.建立socket連接，連向server監聽的端口號*/
    var socket = io('ws://localhost:8080');
    var myName = null;

    /*A.登入事件*/
    // A-1.取得使用者輸入的姓名
    $('.login-btn').click(function () {
        myName = $.trim($('#loginName').val()); //$.trim => 去除空格
        if (myName) {
            /*發送事件*/
            //.emit => 用於發送事件
            socket.emit('login', { username: myName })

            /*觸發檢查用的事件*/
            socket.on('login', function (data) {
                console.log(data);
            })
        } else {
            alert('Please enter a name:)')
        }
    })
    
    // A-2.socket登入成功 - loginSuccess
    socket.on('loginSuccess', function (data) {
        if (data.username === myName) {
            checkIn(data) //隱藏登入頁，顯示聊天頁，並把data傳入
        } else {
            alert('Wrong username:( Please try again!')
        }
    })

    // A-3.socket登入失敗 - loginFail
    socket.on('loginFail', function () {
        alert('Duplicate name already exists:0')
    })
    // A-4. 使用者加入聊天室的提示
    socket.on('add', function (data) {
        var html = `<p>${data.username} 加入聊天室</p>`
        $('.chat-con').append(html);
        document.getElementById('chat-title').innerHTML = `在線人數: ${data.userCount}`
    })
    // A-5.隱藏登入頁，顯示聊天頁
    function checkIn(data) {
        $('.login-wrap').hide('slow');
        $('.chat-wrap').show('slow');
    }

    /*B.退出事件 */
    // b-1.點擊退出時確認是否真的要退出
    $('.leaveBtn').click(function () {
        // confirm - https://www.fooish.com/javascript/alert-confirm-prompt.html
        let leave = confirm('你確定要退出嗎?');
        if (leave) {
            /*觸發 logout 事件*/
            // logout 事件會觸發leaveSuccess和leave
            socket.emit('logout', { username: myName });
        }
    })

    // b-2.離開成功 (在socket 觸發logout時被調用)
    socket.on('leaveSuccess', function () {
        checkOut();
    })

    function checkOut() {
        $(".login-wrap").show('slow');
        $(".chat-wrap").hide("slow");
    }

    // b-3.退出提示 (在socket 觸發logout時被調用)
    socket.on('leave', function (data) {
        if (data.username != null) {
            let html = `<p>${data.username} 退出聊天室</p>`;
            $('.chat-con').append(html);
            document.getElementById('chat-title').innerHTML = `在線人數: ${data.userCount}`;
        }
    })


    /* C.發送訊息交流 */
    // C-01.按下send按鈕
    $('.sendBtn').click(function () {
        sendMessage()
    });
    // C-01.按下Enter 
    $(document).keydown(function (evt) {
        if (evt.keyCode == 13) {
            sendMessage()
        }
    })

    //C-02.客戶端主動發送訊息
    function sendMessage() {
        let txt = $('#sendtxt').val();
        $('#sendtxt').val('');
        if (txt) {
            /*觸發 sendMessage 事件*/
            socket.emit('sendMessage', { username: myName, message: txt });
        }
    }

    //C-03.客戶端主動發訊息後會在伺服器觸發receiveMessage
    socket.on('receiveMessage', function (data) {
        showMessage(data)
    })
    /*顯示訊息*/
    function showMessage(data) {
        var html;
        if (data.username === myName) { //是自己發出 > 顯示訊息在畫面右邊
            html = `<div class="chat-item item-right clearfix">
                        <span class="abs uname">me</span>
                        <span class="message fr">${data.message}</span>
                    </div>`
        } else {  //不是 >顯示訊息在畫面左邊
            html = `<div class="chat-item item-left clearfix rela">
                        <span class="abs uname">${data.username}</span>
                        <span class="fl message">${data.message}</span>
                    </div>`
        }
        $('.chat-con').append(html);
    }

})