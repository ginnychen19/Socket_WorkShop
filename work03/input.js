export const keyboardState = {
    front: false,    //前
    back: false,     //後
    left: false,     //向左轉向
    right: false,    //向右轉向
    jump: false      //跳
};
export const touchState = {
    front: false,
    back: false,
    left: false,
    right: false,
    jump: false //緊急煞車
};

// 按鍵設定
const W = ['w', 'arrowup'];
const A = ['a', 'arrowleft'];
const S = ['s', 'arrowdown'];
const D = ['d', 'arrowright'];
const R = ['r'];
const SPACE = [' '];
export { W, A, S, D, R, SPACE };

export class InputHandler {
    constructor() {
        this.keyboardState = keyboardState;
        this.touchState = touchState;

        this.keysPressed = {};       //紀錄按鍵狀態
        this.front = false;          //往前
        this.brake = false;          //退後
        this.left = false;           //向左轉向
        this.right = false;          //向右轉向
        this.jump = false;           //跳躍  
        this.reset = false;          //回到原點

        this.touchStart = { x: 0, y: 0 }; //joystick可使用 (手機端移動)
        this.touching = false;
        this.touchThreshold = 30;    //觸摸門檻
    }
    startAddEventListener() {
        document.addEventListener('keydown', (event) => this.updateKey(event, true), false);
        document.addEventListener('keyup', (event) => this.updateKey(event, false), false);

        document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    }
    updateKey(event, isPressed) {
        const key = event.key.toLowerCase();
        this.keysPressed[key] = isPressed;
    }
    isPressed(keyArray) {
        return keyArray.some(key => this.keysPressed[key]);
    }
    updateKeyboardState() {/* 從這裡去更新 我們現在要執行那些動作 */
        this.keyboardState.front = this.isPressed(W);               //加速
        this.keyboardState.back = this.isPressed(S);               //煞車 or 往後?
        this.keyboardState.left = this.isPressed(A);           //向左轉
        this.keyboardState.right = this.isPressed(D);          //向後轉
        this.keyboardState.jump = this.isPressed(SPACE);  //緊急煞車
        this.keyboardState.reset = this.isPressed(R);               //歸0
    }

    onTouchStart(event) {
        const touch = event.touches[0];
        this.touchStart.x = touch.clientX;
        this.touchStart.y = touch.clientY;
        this.touching = true;
    }

    onTouchMove(event) {
        if (!this.touching) return;

        const touch = event.touches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;

        this.touchState.front = Math.abs(dy) > this.touchThreshold && dy < 0;
        this.touchState.back = Math.abs(dy) > this.touchThreshold && dy > 0;
        this.touchState.left = Math.abs(dx) > this.touchThreshold && dx < 0;
        this.touchState.right = Math.abs(dx) > this.touchThreshold && dx > 0;
    }

    onTouchEnd(event) {
        this.touching = false;
        // 停止所有操作
        this.touchState.front = false;
        this.touchState.back = false;
        this.touchState.left = false;
        this.touchState.right = false;
    }
}
