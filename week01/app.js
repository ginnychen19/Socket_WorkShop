/*建立http服務*/
var app = require('http').createServer()
/*引入socket.io*/
var io = require('socket.io')(app);
/*自訂監聽端口*/
var port = 8080;
app.listen(port);

console.log('app listen at' + port);
