// ================== 配置 ==================
const API_BASE = 'https://your-backend.onrender.com/api'; // 部署后端后替换为实际地址

// ================== 状态管理 ==================
let currentUser = null;

// 从 sessionStorage 恢复登录状态
const saved = sessionStorage.getItem('carpool_user');
if (saved) {
    currentUser = JSON.parse(saved);
}

// ================== 渲染控制 ==================
function renderView(view) {
    if (!currentUser && view !== 'login' && view !== 'register') {
        view = 'login';
    }

    const container = document.getElementById('app');
    if (view === 'login') renderLogin(container);
    else if (view === 'register') renderRegister(container);
    else if (view === 'admin') renderAdmin(container);
    else if (view === 'driver') renderDriver(container);
    else if (view === 'passenger') renderPassenger(container);
}

// ================== 登录界面 ==================
function renderLogin(container) {
    container.innerHTML = `
        <div class="navbar">
            <h2>🚗 顺风车 · 登录</h2>
            <button class="secondary" onclick="renderView('register')">前往注册</button>
        </div>
        <div class="card" style="max-width: 400px; margin: 40px auto;">
            <input type="text" id="loginPhone" placeholder="手机号" value="13307464001">
            <input type="password" id="loginPassword" placeholder="密码" value="123456">
            <button id="loginBtn" style="width: 100%;">登录</button>
            <p class="text-sm" style="margin-top: 16px;">默认管理员: 13307464001 / 123456</p>
        </div>
    `;
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
}

async function handleLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!phone || !password) return alert('请输入手机号和密码');

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            sessionStorage.setItem('carpool_user', JSON.stringify(currentUser));
            renderView(currentUser.role);
        } else {
            alert(data.error || '登录失败');
        }
    } catch (err) {
        alert('网络错误，请稍后重试');
    }
}

// ================== 注册界面 ==================
function renderRegister(container) {
    container.innerHTML = `
        <div class="navbar">
            <h2>📝 注册新账户</h2>
            <button class="secondary" onclick="renderView('login')">返回登录</button>
        </div>
        <div class="card" style="max-width: 400px; margin: 40px auto;">
            <input type="text" id="regName" placeholder="姓名/昵称">
            <input type="text" id="regPhone" placeholder="手机号">
            <input type="password" id="regPassword" placeholder="密码">
            <select id="regRole">
                <option value="driver">司机</option>
                <option value="passenger">乘客</option>
            </select>
            <button id="registerBtn" style="width: 100%;">注册</button>
        </div>
    `;
    document.getElementById('registerBtn').addEventListener('click', handleRegister);
}

async function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const role = document.getElementById('regRole').value;
    if (!name || !phone || !password) return alert('请填写完整');

    try {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            alert('注册成功，请登录');
            renderView('login');
        } else {
            alert(data.error || '注册失败');
        }
    } catch (err) {
        alert('网络错误，请稍后重试');
    }
}

// ================== 管理员界面 ==================
async function renderAdmin(container) {
    // 获取当前单价
    const settings = await fetchSettings();
    container.innerHTML = `
        <div class="navbar">
            <h2>👤 管理员面板</h2>
            <div>
                <span class="role-tag">管理员</span>
                <button class="secondary" onclick="logout()">登出</button>
            </div>
        </div>
        <div class="card">
            <h3>⚙️ 费用设置 (每公里单价)</h3>
            <input type="number" id="pricePerKm" step="0.1" min="0" value="${settings.price_per_km}">
            <button id="saveSettings">保存单价</button>
        </div>
        <div class="card">
            <h3>📋 全部用户</h3>
            <div id="userList">加载中...</div>
        </div>
        <div class="card">
            <h3>📦 全部订单</h3>
            <div id="orderListAdmin">加载中...</div>
        </div>
    `;

    document.getElementById('saveSettings').addEventListener('click', async () => {
        const price = parseFloat(document.getElementById('pricePerKm').value);
        if (isNaN(price) || price < 0) return alert('请输入有效的价格');
        try {
            const res = await fetch(`${API_BASE}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pricePerKm: price })
            });
            if (res.ok) {
                alert('单价已更新');
                renderView('admin');
            } else {
                alert('更新失败');
            }
        } catch (err) {
            alert('网络错误');
        }
    });

    // 加载用户列表
    loadUsers();
    // 加载订单列表
    loadAllOrders();
}

async function loadUsers() {
    // 由于没有专门的获取所有用户接口，这里从后端直接获取，但为了简化，可以跳过或后续添加
    // 此处略，实际可添加一个管理员获取用户列表的接口，但本系统暂不实现，只显示提示
    document.getElementById('userList').innerHTML = '<p class="text-sm">（用户列表功能需后端扩展）</p>';
}

async function loadAllOrders() {
    // 同样，没有获取所有订单的接口，这里留空
    document.getElementById('orderListAdmin').innerHTML = '<p class="text-sm">（订单列表功能需后端扩展）</p>';
}

// ================== 司机界面 ==================
async function renderDriver(container) {
    container.innerHTML = `
        <div class="navbar">
            <h2>🚘 司机工作台 (${currentUser.name})</h2>
            <div>
                <span class="role-tag">司机</span>
                <button class="secondary" onclick="logout()">登出</button>
            </div>
        </div>
        <div class="flex" style="margin-bottom: 16px;">
            <button id="showPostCar">🚗 发布车找人</button>
            <button id="showMyTrips" class="secondary">📋 我的行程</button>
            <button id="showPassengerDemands" class="secondary">👥 乘客需求</button>
            <button id="showDriverOrders" class="secondary">📦 我的订单</button>
        </div>
        <div id="driverContent"></div>
    `;

    document.getElementById('showPostCar').addEventListener('click', () => renderPostCar());
    document.getElementById('showMyTrips').addEventListener('click', () => renderMyCarTrips());
    document.getElementById('showPassengerDemands').addEventListener('click', () => renderPassengerDemands());
    document.getElementById('showDriverOrders').addEventListener('click', () => renderDriverOrders());

    // 默认显示发布
    renderPostCar();
}

// 发布车找人（带途经点）
async function renderPostCar() {
    const settings = await fetchSettings();
    const contentDiv = document.getElementById('driverContent');
    contentDiv.innerHTML = `
        <div class="card">
            <h3>发布车找人</h3>
            <input type="text" id="carStart" placeholder="起点" value="人民广场">
            <div id="waypointsContainer"></div>
            <button type="button" id="addWaypointBtn" class="secondary">+ 添加途经点</button>
            <input type="text" id="carEnd" placeholder="终点" value="科技园">
            <input type="datetime-local" id="carTime" value="${new Date().toISOString().slice(0,16)}">
            <input type="number" id="carSeats" placeholder="座位数" min="1" value="3">
            <input type="number" id="carDistance" placeholder="里程 (公里)" step="0.1" min="0" value="15">
            <p>当前单价: ¥${settings.price_per_km}/公里  预估费用: <span id="previewFee">${(15 * settings.price_per_km).toFixed(2)}</span>元</p>
            <button id="publishCarBtn">发布行程</button>
        </div>
    `;

    document.getElementById('addWaypointBtn').addEventListener('click', () => {
        const container = document.getElementById('waypointsContainer');
        const div = document.createElement('div');
        div.className = 'waypoint-item';
        div.innerHTML = `<input type="text" class="waypoint-input" placeholder="途经点"><button class="remove-waypoint">删除</button>`;
        div.querySelector('.remove-waypoint').addEventListener('click', () => div.remove());
        container.appendChild(div);
    });

    document.getElementById('carDistance').addEventListener('input', (e) => {
        const dist = parseFloat(e.target.value) || 0;
        document.getElementById('previewFee').innerText = (dist * settings.price_per_km).toFixed(2);
    });

    document.getElementById('publishCarBtn').addEventListener('click', async () => {
        const start = document.getElementById('carStart').value.trim();
        const end = document.getElementById('carEnd').value.trim();
        const time = document.getElementById('carTime').value;
        const seats = parseInt(document.getElementById('carSeats').value);
        const distance = parseFloat(document.getElementById('carDistance').value);
        if (!start || !end || !time || !seats || !distance) return alert('请填写完整');

        const waypoints = Array.from(document.querySelectorAll('.waypoint-input')).map(i => i.value.trim()).filter(v => v);

        try {
            const res = await fetch(`${API_BASE}/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publisherId: currentUser.id,
                    type: 'car',
                    start,
                    waypoints,
                    end,
                    time,
                    seats,
                    distance
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('发布成功');
                renderView('driver');
            } else {
                alert('发布失败：' + data.error);
            }
        } catch (err) {
            alert('网络错误');
        }
    });
}

// 显示我发布的车找人
async function renderMyCarTrips() {
    const contentDiv = document.getElementById('driverContent');
    contentDiv.innerHTML = '<div class="card"><h3>我的行程</h3><p>加载中...</p></div>';
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/trips`);
        const trips = await res.json();
        const carTrips = trips.filter(t => t.type === 'car');
        contentDiv.innerHTML = `
            <div class="card">
                <h3>我发布的车找人</h3>
                ${carTrips.length ? carTrips.map(t => `
                    <div class="card">
                        <div>${t.start_loc} → ${t.end_loc}</div>
                        <div>时间: ${new Date(t.depart_time).toLocaleString()}</div>
                        <div>座位: ${t.seats} | 里程: ${t.distance}公里 | 费用: ¥${t.fee}</div>
                        <div>途经点: ${t.waypoints && t.waypoints.length ? t.waypoints.join(' → ') : '无'}</div>
                        <div>状态: ${t.status}</div>
                    </div>
                `).join('') : '<p>暂无发布</p>'}
            </div>
        `;
    } catch (err) {
        contentDiv.innerHTML = '<div class="card"><p>加载失败</p></div>';
    }
}

// 显示乘客需求（人找车）
async function renderPassengerDemands() {
    const contentDiv = document.getElementById('driverContent');
    contentDiv.innerHTML = '<div class="card"><h3>乘客需求</h3><p>加载中...</p></div>';

    // 获取所有开放的人找车
    let personTrips = [];
    try {
        const res = await fetch(`${API_BASE}/trips/person`);
        personTrips = await res.json();
    } catch (err) {
        contentDiv.innerHTML = '<div class="card"><p>加载失败</p></div>';
        return;
    }

    // 获取司机自己的车找人行程（用于接单选择）
    let myCarTrips = [];
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/trips`);
        const trips = await res.json();
        myCarTrips = trips.filter(t => t.type === 'car' && t.status === 'open');
    } catch (err) {
        // 忽略
    }

    contentDiv.innerHTML = `
        <div class="card">
            <h3>乘客发布的 人找车 (可接单)</h3>
            ${personTrips.length ? personTrips.map(pt => `
                <div class="card" style="margin-bottom:10px;">
                    <div>👤 ${pt.publisherName}  ${pt.start_loc} → ${pt.end_loc} 时间:${new Date(pt.depart_time).toLocaleString()} 人数:${pt.passengers}</div>
                    <select id="selectCar_${pt.id}" style="width:auto; display:inline-block; margin-right:8px;">
                        <option value="">选择你的行程</option>
                        ${myCarTrips.map(t => `<option value="${t.id}">${t.start_loc}→${t.end_loc} ¥${t.fee}</option>`).join('')}
                    </select>
                    <button class="acceptBtn" data-trip-person-id="${pt.id}" data-passenger-id="${pt.publisher_id}">接单</button>
                </div>
            `).join('') : '<p>暂无乘客需求</p>'}
        </div>
    `;

    document.querySelectorAll('.acceptBtn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const personTripId = e.target.dataset.tripPersonId;
            const passengerId = e.target.dataset.passengerId;
            const select = document.getElementById(`selectCar_${personTripId}`);
            const selectedCarId = select.value;
            if (!selectedCarId) return alert('请先选择一个你的行程');

            try {
                const res = await fetch(`${API_BASE}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tripCarId: selectedCarId,
                        tripPersonId: personTripId,
                        driverId: currentUser.id,
                        passengerId: passengerId
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    alert('接单成功，请尽快上传二维码');
                    renderView('driver');
                } else {
                    alert('接单失败：' + data.error);
                }
            } catch (err) {
                alert('网络错误');
            }
        });
    });
}

// 司机订单管理
async function renderDriverOrders() {
    const contentDiv = document.getElementById('driverContent');
    contentDiv.innerHTML = '<div class="card"><h3>我的订单</h3><p>加载中...</p></div>';
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/orders?role=driver`);
        const orders = await res.json();
        contentDiv.innerHTML = `
            <div class="card">
                <h3>我的接单 (司机视角)</h3>
                ${orders.length ? orders.map(o => `
                    <div class="card order-item">
                        <div>乘客: ${o.passengerName} | 路线: ${o.start_loc}→${o.end_loc} | ¥${o.fee}</div>
                        <div>状态: ${o.status === 'wait_qr' ? '⏳待上传二维码' : o.status === 'wait_pay' ? '💰待乘客付款' : '✅已完成'}</div>
                        ${o.status === 'wait_qr' ? `
                            <input type="file" id="qrUpload_${o.id}" accept="image/*">
                            <button class="uploadQrBtn" data-order-id="${o.id}">上传二维码</button>
                        ` : o.status === 'wait_pay' && o.qr_code ? `
                            <img src="${o.qr_code}" class="qrcode-preview" alt="收款码">
                        ` : ''}
                    </div>
                `).join('') : '<p>暂无订单</p>'}
            </div>
        `;

        document.querySelectorAll('.uploadQrBtn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.orderId;
                const fileInput = document.getElementById(`qrUpload_${orderId}`);
                const file = fileInput.files[0];
                if (!file) return alert('请选择图片');

                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const qrBase64 = ev.target.result;
                    try {
                        const res = await fetch(`${API_BASE}/orders/${orderId}/qrcode`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ qrCode: qrBase64 })
                        });
                        if (res.ok) {
                            alert('二维码上传成功');
                            renderView('driver');
                        } else {
                            alert('上传失败');
                        }
                    } catch (err) {
                        alert('网络错误');
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    } catch (err) {
        contentDiv.innerHTML = '<div class="card"><p>加载失败</p></div>';
    }
}

// ================== 乘客界面 ==================
async function renderPassenger(container) {
    container.innerHTML = `
        <div class="navbar">
            <h2>🧑 乘客工作台 (${currentUser.name})</h2>
            <div>
                <span class="role-tag">乘客</span>
                <button class="secondary" onclick="logout()">登出</button>
            </div>
        </div>
        <div class="flex" style="margin-bottom: 16px;">
            <button id="showPostPerson">👤 发布人找车</button>
            <button id="showMyPersonTrips" class="secondary">📋 我的需求</button>
            <button id="showPassengerOrders" class="secondary">📦 我的订单</button>
        </div>
        <div id="passengerContent"></div>
    `;

    document.getElementById('showPostPerson').addEventListener('click', () => renderPostPerson());
    document.getElementById('showMyPersonTrips').addEventListener('click', () => renderMyPersonTrips());
    document.getElementById('showPassengerOrders').addEventListener('click', () => renderPassengerOrders());

    renderPostPerson();
}

// 发布人找车
async function renderPostPerson() {
    const contentDiv = document.getElementById('passengerContent');
    contentDiv.innerHTML = `
        <div class="card">
            <h3>发布人找车</h3>
            <input type="text" id="personStart" placeholder="起点" value="火车站">
            <input type="text" id="personEnd" placeholder="终点" value="大学城">
            <input type="datetime-local" id="personTime" value="${new Date().toISOString().slice(0,16)}">
            <input type="number" id="personPassengers" placeholder="同行人数" min="1" value="1">
            <button id="publishPersonBtn">发布需求</button>
        </div>
    `;

    document.getElementById('publishPersonBtn').addEventListener('click', async () => {
        const start = document.getElementById('personStart').value.trim();
        const end = document.getElementById('personEnd').value.trim();
        const time = document.getElementById('personTime').value;
        const passengers = parseInt(document.getElementById('personPassengers').value);
        if (!start || !end || !time || !passengers) return alert('请填写完整');

        try {
            const res = await fetch(`${API_BASE}/trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publisherId: currentUser.id,
                    type: 'person',
                    start,
                    waypoints: [], // 人找车也可有途经点，但暂不支持，留空
                    end,
                    time,
                    passengers
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('需求发布成功');
                renderView('passenger');
            } else {
                alert('发布失败：' + data.error);
            }
        } catch (err) {
            alert('网络错误');
        }
    });
}

// 我发布的人找车
async function renderMyPersonTrips() {
    const contentDiv = document.getElementById('passengerContent');
    contentDiv.innerHTML = '<div class="card"><h3>我的需求</h3><p>加载中...</p></div>';
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/trips`);
        const trips = await res.json();
        const personTrips = trips.filter(t => t.type === 'person');
        contentDiv.innerHTML = `
            <div class="card">
                <h3>我发布的人找车</h3>
                ${personTrips.length ? personTrips.map(t => `
                    <div class="card">
                        <div>${t.start_loc} → ${t.end_loc}</div>
                        <div>时间: ${new Date(t.depart_time).toLocaleString()}</div>
                        <div>人数: ${t.passengers}</div>
                        <div>状态: ${t.status === 'open' ? '待接单' : '已接单'}</div>
                    </div>
                `).join('') : '<p>暂无发布</p>'}
            </div>
        `;
    } catch (err) {
        contentDiv.innerHTML = '<div class="card"><p>加载失败</p></div>';
    }
}

// 乘客订单管理
async function renderPassengerOrders() {
    const contentDiv = document.getElementById('passengerContent');
    contentDiv.innerHTML = '<div class="card"><h3>我的订单</h3><p>加载中...</p></div>';
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}/orders?role=passenger`);
        const orders = await res.json();
        contentDiv.innerHTML = `
            <div class="card">
                <h3>我的订单 (乘客视角)</h3>
                ${orders.length ? orders.map(o => `
                    <div class="card order-item">
                        <div>司机: ${o.drivername} | 路线: ${o.start_loc}→${o.end_loc} | 费用: ¥${o.fee}</div>
                        <div>状态: ${o.status === 'wait_qr' ? '⏳司机准备中' : o.status === 'wait_pay' ? '💰待付款' : '✅已完成'}</div>
                        ${o.status === 'wait_pay' && o.qr_code ? `
                            <img src="${o.qr_code}" class="qrcode-preview" alt="收款码">
                            <button class="payBtn" data-order-id="${o.id}">模拟付款</button>
                        ` : ''}
                    </div>
                `).join('') : '<p>暂无订单</p>'}
            </div>
        `;

        document.querySelectorAll('.payBtn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.target.dataset.orderId;
                try {
                    const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
                        method: 'PUT'
                    });
                    if (res.ok) {
                        alert('付款成功');
                        renderView('passenger');
                    } else {
                        alert('付款失败');
                    }
                } catch (err) {
                    alert('网络错误');
                }
            });
        });
    } catch (err) {
        contentDiv.innerHTML = '<div class="card"><p>加载失败</p></div>';
    }
}

// ================== 工具函数 ==================
async function fetchSettings() {
    try {
        const res = await fetch(`${API_BASE}/settings`);
        return await res.json();
    } catch (err) {
        return { price_per_km: 2.0 };
    }
}

function logout() {
    sessionStorage.removeItem('carpool_user');
    currentUser = null;
    renderView('login');
}

// 暴露全局函数供 onclick 调用
window.renderView = renderView;
window.logout = logout;

// 启动
renderView(currentUser ? currentUser.role : 'login');