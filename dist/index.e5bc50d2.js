$(function() {
    /*建立socket連接，連向server監聽的端口號*/ var socket = io("ws://localhost:8080");
    /*你的名稱*/ var myName = null;
    /*登入事件*/ $(".login-btn").click(function() {
        myName = $.trim($("#loginName").val()); //$.trim => 去除空格
        if (myName) {
            /*發送事件*/ //.emit => 用於發送事件
            socket.emit("login", {
                username: myName
            });
            /* 在前台收後台的資料 */ socket.on("login", function(data) {
                console.log(data);
            });
        } else alert("Please enter a name:)");
    });
});

//# sourceMappingURL=index.e5bc50d2.js.map
