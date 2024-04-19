// server.js
const { PhysicsWorld } = require('./physicsWorld.js');
const { CharacterControls } = require('./character.js');
const { FoodManager } = require('./foodManager.js');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class Server {
    constructor(port) {
        this.physicsWorld = new PhysicsWorld();
        this.playerHeight = 3.35;
        this.radius = 0.65;
        this.players = {};
        this.keysPressed = {};
        this.foodManager = new FoodManager(this.physicsWorld, {}, null);

        this.port = port;
        this.wss = new WebSocket.Server({ port: this.port });
        this.connectedPlayers = 0;
    }

    async start() {
        await this.physicsWorld.init();
        this.setupWebSocketServer();
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws) => {
            const clientId = uuidv4();
            console.log(`客戶端連接: ${clientId}`);
            // 對每個新連接的客戶端進行處理
            this.handleNewConnection(ws, clientId);

            ws.on('message', (message) => {
                this.handleIncomingMessage(message, ws);
            });

            ws.on('close', () => {
                this.handleDisconnection(clientId);
            });
        });

        this.startPhysicsLoop();
    }

    handleNewConnection(ws, clientId) {
        this.connectedPlayers += 1;

        this.players[clientId] = new CharacterControls(
            this.physicsWorld, { x: 0, y: this.playerHeight, z: 0 }, this.playerHeight, ws, this.wss, clientId
        );

        ws.send(JSON.stringify({ type: 'assignId', id: clientId }));
        this.foodManager.ws = ws;

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'newPlayer',
                    id: clientId,
                    position: { x: 0, y: this.playerHeight, z: 0 } // 假設初始位置
                }));
            }
        });

        ws.send(JSON.stringify({
            type: 'existingPlayers',
            players: Object.entries(this.players).map(([id, player]) => ({
                id,
                position: player.position // 假設這裡可以獲取到位置
            }))
        }));

        const existingFoods = Object.entries(this.foodManager.foods).map(([id, food]) => ({
            id,
            foodType: food.foodType, // 假設您有存儲食物類型的方式
            position: food.translation(), // 假設您有方法獲取食物的當前位置
            rotation: food.rotation(), // 假設您有方法獲取食物的當前旋轉
        }));
    
        ws.send(JSON.stringify({
            type: 'existingFoods',
            foods: existingFoods
        }));
    }

    handleIncomingMessage(message, ws) {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'sceneModel') {
            this.physicsWorld.createScene(data.modelData);
        } else if (data.type === 'foodModel') {
            this.foodManager.foodsModel = data.modelData;
        } else if (data.type === 'action') {
            // 只更新發送動作那個玩家的狀態
            const playerId = data.id;
            if (this.players[playerId]) {
                // 更新這個玩家的keysPressed
                this.players[playerId].keysPressed = data.action;
            }
        } else if (data.type === 'generateFood') {
            const foodId = uuidv4();
            this.foodManager.getFoodsGeneration(foodId, data.foodType);
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'foodCreated',
                        foodType: data.foodType,
                        id: foodId,
                        position: this.foodManager.foods[foodId].translation(),
                        rotation: this.foodManager.foods[foodId].rotation(),
                    }));
                }
            });
        } else if (data.type === 'cameraQuaternion') {
            const playerId = data.id;
            if (this.players[playerId]) {
                this.players[playerId].cameraQuaternion = data.quaternion;
            }
        } else if (data.type === 'switchView') {
            const playerId = data.id;
            if (this.players[playerId]) {
                this.players[playerId].isFirstPerson = data.view;
            }
        } else if (data.type === 'toggleHolding') {
            const playerId = data.id;
            if (this.players[playerId]) {
                this.players[playerId].isHoldingItem = data.toggleHolding;
            }
        }
    }

    handleDisconnection(clientId) {
        this.connectedPlayers -= 1;
        console.log(`客戶端斷開連接: ${clientId}`);
        // 從玩家列表中移除
        if (this.players[clientId].rigidBody) {
            this.physicsWorld.world.removeRigidBody(this.players[clientId].rigidBody);
        }
        delete this.players[clientId];
        // 向所有客戶端廣播玩家離開的消息
        this.wss.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'playerLeft',
                    id: clientId
                }));
            }
        });

        // 如果沒有玩家連接，清除所有食物
        if (this.connectedPlayers === 0) {
            this.foodManager.clearAllFoods();
            console.log('所有食物已被清除。');
        }
    }

    startPhysicsLoop() {
        const physicsStepInterval = 1000 / 60; // 物理更新頻率（大約每16毫秒更新一次）
        const broadcastInterval = 1000 / 15; // 資訊廣播頻率（每66.66666毫秒廣播一次）
        let lastBroadcastTime = Date.now();

        setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - lastBroadcastTime) / 1000.0;

            this.physicsWorld.update();

            if (now - lastBroadcastTime > broadcastInterval) {
                // 更新所有玩家的位置並廣播
                Object.entries(this.players).forEach(([clientId, player]) => {
                    player.update(deltaTime, player.keysPressed);
        
                    // 這裡應該直接傳送每位玩家的更新資訊，而不是重新映射所有玩家的狀態
                    const simplifiedPlayer = {
                        id: clientId, // 加入玩家ID
                        position: player.rigidBody.translation(),
                        rotation: player.rigidBody.rotation()
                    };
            
                    this.wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            // 對於每位玩家，單獨發送其更新信息
                            client.send(JSON.stringify({ type: 'move', player: simplifiedPlayer }));
                        }
                    });
                });
    
                if (this.foodManager?.foods) {
                    Object.entries(this.foodManager.foods).forEach(([foodId, food]) => {
                        const simplifiedFood = {
                            id: foodId,
                            position: food.translation(),
                            rotation: food.rotation(),
                        };

                        this.wss.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ type: 'foodMove', food: simplifiedFood }));
                            }
                        });
                    });
                }
    
                lastBroadcastTime = now; // 更新最後廣播時間
            }
        }, physicsStepInterval);
    }

    // 在這裡添加更多類方法，以處理不同的業務邏輯
}

const server = new Server(3000);
server.start();