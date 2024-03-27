/*
01. 監聽碰撞事件：
    為每個連線的用戶端監聽 iscollision 事件，該事件會在用戶端偵測到碰撞時觸發，
    並傳送相關資料（包括物件ID和碰撞時的線性速度和角速度）到伺服器。

02. 事件處理與儲存：
    檢查 collisionEventsMap（一個 Map 物件），看是否已經為發生碰撞的物件ID建立了條目。
    如果沒有，為該物體ID建立一個新的條目，其中包含一個包含目前碰撞事件的陣列和一個計時器。
    如果已存在條目，將目前碰撞事件新增至該物體ID對應的事件陣列。
    定時器設定：對於每個新的物體ID，設定一個定時器，當定時器觸發（在這個例子中是1秒後）時，執行以下操作：

03. 碰撞事件的聚合處理：
    呼叫 processCollisions 函數處理該物體ID對應的所有碰撞事件。
    在 processCollisions 函數中，遍歷事件數組，累加所有碰撞事件的線性速度和角速度，然後計算平均值。
    結果廣播：將處理後的平均線性速度和角速度傳送給所有客戶端。

    清理：處理完畢後，從 collisionEventsMap 中刪除該物件ID的條目，為處理下一批碰撞事件做準備。
*/
const io = require('socket.io')(server);
let collisionEventsMap = new Map();

io.on('connection', (socket) => {
    socket.on('iscollision', (data) => {
        /* 01.每次發生碰撞事件，取得當前碰撞物件是什麼，在collisionEventsMap依照該ID建立一個物件
              collisionEventsMap 实际上是一个 Map 对象，而不是一个数组或普通对象。
              在 Map 中，每个键（在这个案例中是 objectId）都映射到一个值
              let collisionEventsMap = Map {
                                       objectId01 => { events: [...], timer: Timer },
                                       objectId02 => { events: [...], timer: Timer },
                                       ...}
        */
        const objectId = data.objectId;
        if (!collisionEventsMap.has(objectId)) { //如果事件陣列中沒有該物件的事件
            collisionEventsMap.set(objectId, { // 為新物體建立事件陣列和定時器
                events: [data], // 直接將當前事件加入
                timer: setTimeout(() => { // 設定定時器，定時器到時後的處理以下內容
                    let objectEvents = collisionEventsMap.get(objectId);
                    if (objectEvents) {
                        // 處理收集到的碰撞事件
                        let aggregatedResult = processCollisions(objectEvents.events);
                        // 將結果發送給客戶端
                        io.emit('collisionProcessed', aggregatedResult);
                        // 清理映射表中的條目
                        collisionEventsMap.delete(objectId);
                    }
                }, 100) // 0.1秒後觸發
            });
        } else {
            // 如果已存在，則將事件加入到該物體的事件陣列中
            let objectEvents = collisionEventsMap.get(objectId);
            objectEvents.events.push(data);
        }
    });
});

/* 中和線性速度與角速度 */
function processCollisions(events) {
    let totalLinVel = { x: 0, y: 0, z: 0 };
    let totalAngVel = { x: 0, y: 0, z: 0 };

    events.forEach(event => {
        totalLinVel.x += event.linVel.x;
        totalLinVel.y += event.linVel.y;
        totalLinVel.z += event.linVel.z;

        totalAngVel.x += event.angVel.x;
        totalAngVel.y += event.angVel.y;
        totalAngVel.z += event.angVel.z;
    });

    // 計算平均值
    let avgLinVel = { x: totalLinVel.x / events.length, y: totalLinVel.y / events.length, z: totalLinVel.z / events.length };
    let avgAngVel = { x: totalAngVel.x / events.length, y: totalAngVel.y / events.length, z: totalAngVel.z / events.length };

    /* 聚合後的線性速度和角速度 */
    return { avgLinVel, avgAngVel };
}