import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GUI } from 'dat.gui';
import TWEEN from '@tweenjs/tween.js';
import { io } from 'socket.io-client';

/* A.初始化場景 */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

/* B.建立一個綠色的方塊 */
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
});
const myObject3D = new THREE.Object3D();
myObject3D.position.x = Math.random() * 4 - 2;
myObject3D.position.z = Math.random() * 4 - 2;
//B-2.生成地板
const gridHelper = new THREE.GridHelper(10, 10);
gridHelper.position.y = -0.5;
scene.add(gridHelper);
camera.position.z = 4;

/* C.畫面RWD */
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

/* D.socket處理的部分 */
let myId = '';
let timestamp = 0;
const clientCubes = {};
const socket = io();
// D-1.socket 收到 伺服器的 connect 事件 (只是客戶端用來確認自己是否連上socket)
socket.on('connect', function () {
    console.log('connect');
});
// D-2.socket 收到 伺服器的 disconnect 事件 (只是客戶端用來確認自己是否斷線，除非我自己關掉Server，不然應該不會觸發)
socket.on('disconnect', function (message) {
    console.log('disconnect ' + message);
});
// D-3.socket 收到 伺服器的 id 事件，之後...就開始每間格50毫秒更新一次該視窗裡物件的位置
socket.on('id', (id) => {
    myId = id;
    setInterval(() => {
        socket.emit('update', {
            t: Date.now(),
            p: myObject3D.position,
            r: myObject3D.rotation,
        });
    }, 50);
});

// D-4.socket 收到 伺服器的 clients 事件 (在伺服器端會一直被呼叫)
socket.on('clients', (clients) => {
    let pingStatsHtml = 'Socket Ping Stats<br/><br/>';
    Object.keys(clients).forEach((p) => {
        //D-4-1.顯示該使用者當前的 ping 值
        //Ping 是指玩家電腦（或用戶端）與另一個用戶端（用戶群）或遊戲伺服器之間的[網絡延遲]
        let pingStatsHtml = 'Socket Ping Stats<br/><br/>'
        timestamp = Date.now(); // 取得現在時間
        pingStatsHtml += p + ' ' + (timestamp - clients[p].t) + 'ms<br/>'; //扣掉記錄在伺服器上面記錄的當前時間後，就能知道與遊戲伺服器之間的[網絡延遲]

        if (!clientCubes[p]) { //clientCubes從未被建立過
            clientCubes[p] = new THREE.Mesh(geometry, material);
            clientCubes[p].name = p;
            scene.add(clientCubes[p]);
        }
        else { //如果該clientCubes已存在，更新位置就行
            if (clients[p].p) {
                new TWEEN.Tween(clientCubes[p].position)
                    .to({
                        x: clients[p].p.x,
                        y: clients[p].p.y,
                        z: clients[p].p.z,
                    }, 50)
                    .start();
            }
            if (clients[p].r) {
                new TWEEN.Tween(clientCubes[p].rotation)
                    .to({
                        x: clients[p].r._x,
                        y: clients[p].r._y,
                        z: clients[p].r._z,
                    }, 50)
                    .start();
            }
        }
    });
    document.getElementById('pingStats').innerHTML = pingStatsHtml;
});
// D-5.socket 收到 伺服器的 removeClient 事件
socket.on('removeClient', (id) => {
    scene.remove(scene.getObjectByName(id));
});

/* E.加入 GUI 介面 */
const stats = new Stats();
document.body.appendChild(stats.dom);
const gui = new GUI();
const cubeFolder = gui.addFolder('Cube');
const cubePositionFolder = cubeFolder.addFolder('Position');
cubePositionFolder.add(myObject3D.position, 'x', -5, 5);
cubePositionFolder.add(myObject3D.position, 'z', -5, 5);
cubePositionFolder.open();
const cubeRotationFolder = cubeFolder.addFolder('Rotation');
cubeRotationFolder.add(myObject3D.rotation, 'x', 0, Math.PI * 2, 0.01);
cubeRotationFolder.add(myObject3D.rotation, 'y', 0, Math.PI * 2, 0.01);
cubeRotationFolder.add(myObject3D.rotation, 'z', 0, Math.PI * 2, 0.01);
cubeRotationFolder.open();
cubeFolder.open();


/* F.實際渲染動畫 */
const animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update();
    if (clientCubes[myId]) {
        camera.lookAt(clientCubes[myId].position);
    }
    render();
    stats.update();
};
const render = function () {
    renderer.render(scene, camera);
};
animate();