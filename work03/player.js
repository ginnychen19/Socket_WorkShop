import * as THREE from 'three';
import { keyboardState, touchState } from './input.js';
import * as RAPIER from '@dimforge/rapier3d-compat';

export class Player {
    constructor(main, physicsWorld, controls, camera) {
        this.main = main;
        this.scene = main.scene;
        this.physicsWorld = physicsWorld;
        this.world = physicsWorld.world;

        /* Input實例化 */
        this.controls = controls;
        this.camera = camera;
        this.gameState = {};
    }
    init() {
        this.createMyBox();
    }
    update() {
        /* 01.讓按件或是手指有輸入時，連動沒使用的那個 */
        this.mergeInputStates();

        /* 移動 */
        if (this.co_player) this.moveUpdate();
        /* 02.更新相機跟隨 */
        // this.updateCamera();
        /* 03.按件狀態檢查 */
        this.controls.updateKeyboardState();

    }

    createMyBoxValue() { /* 建立隨機數值 */
        // Generate a random size from 5 to 10
        const size = 5 + Math.floor(Math.random() * 5);
        // Generate a random x position from -10 to 10
        const x = Math.floor((Math.random() * 2 - 1) * 10);
        // Generate a random y position from 15 to 20
        const y = Math.floor(15 + Math.random() * 20);
        const z = Math.floor((Math.random() * 2 - 1) * 10);
        const color = Math.floor(Math.random() * 0x100000).toString(16).padStart(6, '0');
        return { size, x, y, z, color };
    }
    createMyBox() { // 建立個人形狀
        let myValue = this.createMyBoxValue();
        const PlayerGeom = new THREE.BoxGeometry(myValue.size, myValue.size, myValue.size);
        const material = new THREE.MeshBasicMaterial({ color: '#' + myValue.color });
        this.playerMash = new THREE.Mesh(PlayerGeom, material);
        this.playerMash.position.set(myValue.x, myValue.y, myValue.z);
        this.scene.add(this.playerMash);

        // 製作方塊物理
        let rigDesc_player = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(myValue.x, myValue.y, myValue.z);
        this.rig_player = this.world.createRigidBody(rigDesc_player);
        this.coDesc_player = RAPIER.ColliderDesc.cuboid(myValue.size / 2, myValue.size / 2, myValue.size / 2);
        this.co_player = this.world.createCollider(this.coDesc_player, this.rig_player);


        /* 製作角色控制器 */
        let offset = 0.01;  // 在角色與其環境之間留下的間隙。
        // 建立控制器。
        let characterController = this.world.createCharacterController(offset);
        // 完成後刪除控制器。
        this.world.removeCharacterController(characterController);
    }

    /* B.物理控制 */
    moveUpdate() {
        const frontForce = 300;     //前進力
        const backForce = 300;      //後退力
        const leftForce = 200;      //左移力
        const rightForce = 200;     //右移力
        const jumpImpulse = 8000;   //跳躍高度

        /* */
        // this.isPlayerOnGround(this.co_player, this.main.co_circlePlane)
        /* B.跳躍處理 */
        if (this.gameState.jump && !this.jumping) {
            this.jumping = true;
            this.rig_player.applyImpulse({ x: 0, y: jumpImpulse, z: 0 }, true);
        } else if (!this.gameState.jump && this.jumping) {
            this.jumping = false;
        }

        /* C.前後邏輯 */
        if (this.gameState.front) {
            this.rig_player.addForce({ x: 0, y: 0, z: -frontForce }, true);
        } else if (this.gameState.back) {
            this.rig_player.addForce({ x: 0, y: 0, z: backForce }, true);
        }

        /* D.轉向邏輯 */
        if (this.gameState.left) {
            this.rig_player.addTorque({ x: 0, y: leftForce, z: 0 }, true);
        } else if (this.gameState.right) {
            this.rig_player.addTorque({ x: 0, y: -rightForce, z: 0 }, true);
        }

        // 如果玩家没有前进也没有后退，逐渐减少z轴上的速度
        /* 這有一個問題，當我們前進後退、左右移動時，玩家的方向永遠是基於世界方向，而不是玩家本身面向的方向 */
        const currentVelocity = this.rig_player.linvel();
        // 可以根据需要调整减速系数
        const damping = 0.9;
        this.rig_player.setLinvel({ x: currentVelocity.x, y: currentVelocity.y, z: currentVelocity.z * damping });

        // 如果玩家没有左转也没有右转，逐渐减少x轴上的旋转
        const currentAngularVelocity = this.rig_player.angvel();
        // 可以根据需要调整旋转阻尼系数
        const angularDamping = 0.6;
        this.rig_player.setAngvel({ x: currentAngularVelocity.x, y: currentAngularVelocity.y * angularDamping, z: currentAngularVelocity.z });
    }

    mergeInputStates() {// 合併鍵盤和觸控輸入狀態
        for (let action in keyboardState) {
            this.gameState[action] = keyboardState[action] || touchState[action];
        }
    }
    updateCamera() { // 相機跟隨
        const cameraOffset = new THREE.Vector3(-10, 5, 0);
        const offset = cameraOffset.clone().applyQuaternion("目標模型.rotation");
        const targetPosition = 目標模型.position.clone().add(offset);
        this.camera.position.lerp(targetPosition, 0.05);
        const lookAtTarget = new THREE.Vector3().lerpVectors(this.camera.position, 目標模型.position, 0.001);
        this.camera.lookAt(lookAtTarget);
    }

    // This function checks if the player is on the ground
    isPlayerOnGround(playerCollider, co_circlePlane) {
        // 设置射线的起点（玩家的位置）和方向（向下）
        const rayStart = playerCollider.translation();
        const rayEnd = {
            x: rayStart.x,
            y: rayStart.y - 0.1, // 玩家底部稍下一点的位置
            z: rayStart.z
        };

        // 使用 Rapier 的世界对象进行射线投射，检查玩家与地面的碰撞
        const hit = co_circlePlane.castRay(rayStart, rayEnd, true);

        // 如果有碰撞，hit 将不为 null，这意味着玩家在地面上
        return hit != null;
    }

}

/*
 aa(){
        const boxObj = new THREE.Object3D();
        boxObj.add(box);
        boxObj.rotation.y = Math.PI / 4; // 先讓長方形做一個旋轉動畫
       this.scene.add(boxObj);
       this.scene.add(new THREE.AxesHelper(10));

        let  mySize, posX, posY, posZ, myColor = this.createMyBoxValue();
        const PlayerGeom = new THREE.BoxGeometry(mySize, mySize, mySize);
        const material = new THREE.MeshBasicMaterial({ color: myColor });
        this.playerMash = new THREE.Mesh(PlayerGeom, material);
        this.scene.add(this.playerMash);

        // 製作方塊物理
        let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(posX, posY, posZ);
        let rigidBody = this.world.createRigidBody(rigidBodyDesc);
        let colliderDesc = RAPIER.ColliderDesc.cuboid(PlayerGeom.x / 2, PlayerGeom.y / 2, PlayerGeom.z / 2);
        colliderDesc.setTranslation(
            (v) => {
                // 把長方形每秒的旋轉轉換成<|query|>座標
                const euler = new THREE.Euler().setFromQuaternion(box.quaternion);
                const rot = new THREE.Matrix4().makeRotationFromEuler(euler);
                const worldPos = new THREE.Vector3().setFromMatrixPosition(boxObj.matrixWorld);
                rot.multiplyVector3(new THREE.Vector3(0, 0, 0)).add(worldPos);
                return rot.elements;
            }
       );
        let collider = this.world.createCollider(colliderDesc, rigidBody);
        // 每秒更新一次物件旋轉
        const animate = () => {
            boxObj.rotation.y += 0.01;
           requestAnimationFrame(animate);
       }
       requestAnimationFrame(animate);
    }
    }


*/