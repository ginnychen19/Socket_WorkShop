// gameManager.js
import * as THREE from 'three';
import { v4 } from 'uuid';
import { CharacterControls } from './character';
import { Guest } from './guest';

export class GameManager {
    constructor(scene, physicsWorld, panda, rabbit, foodsModel, foodManager, orbitControls, camera, ws, colliderScene) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.panda = panda;
        this.rabbit = rabbit;
        this.foods = {};
        Object.entries(foodsModel).forEach(([type, food]) => {
            this.foods[type] = this.convexHullModelData(food.scene);
        });
        this.foodManager = foodManager;

        this.orbitControls = orbitControls;
        this.camera = camera;

        this.isFirstPerson = false;
        this.players = {};
        this.guests = [];
        this.playerHeight = 3.35;
        this.playerOnGround = this.playerHeight / 2;
        this.clientId = null;
        this.sceneModelData = this.extractModelData(colliderScene.scene);
        this.ws = ws;
        // this.ws = new WebSocket('ws://localhost:3000');
        this.foodManager.ws = this.ws;
        this.pingTimestamp = 0;
        this.actualLatency = 50;
        this.initWebSocket();
        this.pingInterval = setInterval(() => this.sendPing(), 1000);
        // this.addGuest();
    }

    sendPing() {
        this.pingTimestamp = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
    }

    extractModelData(model) {
        let data = [];
        model.traverse(child => {
            if (child.isMesh) {
                child.geometry.computeVertexNormals();
                child.geometry.computeBoundingBox();
                const vertices = child.geometry.attributes.position.array;
                const indices = child.geometry.index ? child.geometry.index.array : undefined;

                data.push({ vertices, indices });
            }
        });
        data = data.filter(data => data !== undefined);
        return data;
    }

    convexHullModelData(model) {
        let points = [];
        model.traverse(child => {
            if (child.isMesh) {
                const positions = child.geometry.attributes.position.array;

                for (let i = 0; i < positions.length; i += 3) {
                    const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
                child.localToWorld(vertex);
                    points.push(vertex.x, vertex.y, vertex.z);
                }
            }
        });
        return points;
    }

    initWebSocket() {
        this.ws.onopen = () => {
            console.log('連接到服務器');
            this.ws.send(JSON.stringify({ type: 'sceneModel', modelData: this.sceneModelData }));
            this.ws.send(JSON.stringify({ type: 'foodModel', modelData: this.foods }));
            this.ws.send(JSON.stringify({ type: 'generateFood', foodType: 'lobster' }));
        };

        this.ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                event.data.text().then((text) => {
                    this.processMessage(JSON.parse(text));
                });
            } else {
                this.processMessage(JSON.parse(event.data));
            }
        };
    }

    processMessage(data) {
        // 根據data.type處理不同類型的消息
        if (data.type === 'pong') {
            const now = Date.now();
            this.actualLatency = (now - this.pingTimestamp) / 2; // 计算往返时间的一半作为延迟
        } else if (data.type === 'assignId') {
            this.clientId = data.id;
            this.addPlayer(data.id, { x: 0, y: this.playerHeight / 2, z: 0 }, true); // 標記為本地玩家

        } else if (data.type === 'newPlayer') {
            // 確保不要重複添加自己
            if (data.id !== this.clientId) {
                this.addPlayer(data.id, data.position, false);
            }
        } else if (data.type === 'existingPlayers') {
            // 處理現有的玩家
            data.players.forEach(player => {
                if (player.id !== this.clientId) {
                    this.addPlayer(player.id, player.position, false);
                }
            });
        } else if (data.type === 'playerLeft') {
            const playerId = data.id;
            // 檢查該玩家是否存在於players物件中
            if (this.players[playerId]) {
                // 如果玩家模型被添加到了Three.js的scene中，從scene中移除
                if (this.players[playerId].model) {
                    this.scene.remove(this.players[playerId].model);
                }
                // 從players物件中刪除玩家
                delete this.players[playerId];
            }
        } else if (data.type === 'move') {
            const playerData = data.player;
            const player = this.players[playerData.id]; // 根據ID找到對應的玩家

            if (player) {
                // 將新的位置和旋轉存儲為目標值
                player.updatePosition(playerData.position, playerData.rotation);
                player.playAnimation(player.currentAction);
            }
        } else if (data.type === 'characterAction') {
            const player = this.players[data.id]; // 假設您有一個存儲所有角色實例的對象
            if (player) {
                player.playAnimation(data.action);
            }
        } else if (data.type === 'foodCreated') {
            this.addFood(data.id, data.foodType, data.position, data.rotation);
        } else if (data.type === 'existingFoods') {
            data.foods.forEach(food => {
                this.addFood(food.id, food.foodType, food.position, food.rotation);
            });
        } else if (data.type === 'foodMove') {
            const foodData = data.food;
            const food = this.foodManager.foods[foodData.id];
            if (food) {
                this.foodManager.updatePosition(foodData.id, foodData.position, foodData.rotation);
            }
        }

    }

    addPlayer(id, position, isLocalPlayer) {
        const newPlayer = new CharacterControls(
            this.scene,
            position,
            this.panda,
            this.playerHeight,
            this.orbitControls,
            this.camera,
            this.ws,
            isLocalPlayer,
            id
        );
        this.players[id] = newPlayer;
    }

    addFood(id, foodType, position, rotation) {
        this.foodManager.getFoodsGeneration(id, foodType, position, rotation);
    } 
}

// addGuest() {
//     const guest1 = new Guest(
//         this.scene,
//         this.physicsWorld,
//         this.rabbit,
//         this.camera,
//         this.foodManager,
//         [
//             new THREE.Vector3(4.6, 0, -20),
//             new THREE.Vector3(4.6, 0, -13),
//             new THREE.Vector3(4.6, 0, -8),
//             new THREE.Vector3(4.6, 0, -4.3),
//             new THREE.Vector3(6.6 + 0.5, 0, -4.3)
//         ]
//     );
//     this.guests.push(guest1);

//     const guest2 = new Guest(
//         this.scene,
//         this.physicsWorld,
//         this.rabbit,
//         this.camera,
//         this.foodManager,
//         [
//             new THREE.Vector3(4.6, 0, -30),
//             new THREE.Vector3(4.6, 0, -20),
//             new THREE.Vector3(4.6, 0, -8),
//             new THREE.Vector3(4.6, 0, -4.3),
//             new THREE.Vector3(3 - 0.5, 0, -4.3)
//         ]
//     );
//     this.guests.push(guest2);

//     const guest3 = new Guest(
//         this.scene,
//         this.physicsWorld,
//         this.rabbit,
//         this.camera,
//         this.foodManager,
//         [
//             new THREE.Vector3(-2.4, 0, -25),
//             new THREE.Vector3(-2.4, 0, -13),
//             new THREE.Vector3(-2.4, 0, -8),
//             new THREE.Vector3(-2.4, 0, -4.3),
//             new THREE.Vector3(-0.6 + 0.5, 0, -4.3)
//         ]
//     );
//     this.guests.push(guest3);

//     const guest4 = new Guest(
//         this.scene,
//         this.physicsWorld,
//         this.rabbit,
//         this.camera,
//         this.foodManager,
//         [
//             new THREE.Vector3(-2.4, 0, -35),
//             new THREE.Vector3(-2.4, 0, -20),
//             new THREE.Vector3(-2.4, 0, -8),
//             new THREE.Vector3(-2.4, 0, -4.3),
//             new THREE.Vector3(-4.1 - 0.5, 0, -4.3)
//         ]
//     );
//     this.guests.push(guest4);
// }