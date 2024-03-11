import * as THREE from 'three';
import { keyboardState, touchState } from './input.js';

export class Player {
    constructor(main, physicsWorld, chassis, wheel, controls, camera) {
        this.main = main;
        this.scene = main.scene;
        this.physicsWorld = physicsWorld;

        /* Input實例化 */
        this.controls = controls;

        this.camera = camera;

        this.gameState = {};
    }
    init() {
    }
    update() {
        /* 01.讓按件或是手指有輸入時，連動沒使用的那個 */
        this.mergeInputStates();
        /* 02.更新相機跟隨 */
        // this.updateCamera();
        /* 03.按件狀態檢查 */
        this.controls.updateKeyboardState();
    }

    /* B.物理控制 */
    moveUpdate() {

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

}