/* A_01.Node.js + Express + Socket.IO建立伺服器 */
import express from 'express';
const mystatic = express['static'];
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
/* 路由設定 */
// 使用時，因為express會設定要取用物件的路徑，所以我設定時，要符合我用parcel打包的路徑
app.use(mystatic('dist')); // 假设 'dist' 是你的前端代码构建输出目录
app.use('/assets', mystatic('assets')); // 为 'assets' 文件夹提供静态文件服务

const server = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "http://localhost:1234",  
        methods: ["GET", "POST"],  
        allowedHeaders: ["my-custom-header"],  
        credentials: true  // 是否允许发送 Cookie
    }
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

let users = {}; // 用于存储所有用户的属性

io.on('connection', (socket) => {
    // 每次有新使用者時，都會觸發 socket.id => 會自動生成一個uuid
    console.log(`A new user connected: ${socket.id}`);

    // 为用户生成随机属性
    const userProperties = { // 在這裡給用戶需要初始化生成的資料先設定好   
        id: socket.id,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        rotation: Math.floor(Math.random() * 360),
        position: {
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10),
            z: Math.floor(Math.random() * 10),
        },
    };

    // 将新用户添加到用户列表
    users[socket.id] = userProperties;

    // 向所有客户端广播更新后的用户列表
    io.emit('updateUsers', Object.values(users));

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        delete users[socket.id]; // 从列表中移除断开连接的用户
        io.emit('updateUsers', Object.values(users)); // 广播更新后的用户列表
        io.emit('userLeft', socket.id); // 通知客户端有用户离开
    });
});