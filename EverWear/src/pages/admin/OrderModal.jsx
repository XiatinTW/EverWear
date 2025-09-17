import React, { useState, useEffect } from "react";
import Toast from '../../components/common/Toast';

function OrderRow({ order, onView, onEdit }) {
    return (
        <tr>
            <td>
                <div style={{ fontWeight: 500 }}>{order.order_id}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{order.user_id}</div>
            </td>
            <td>
                <div style={{ fontWeight: 500 }}>{order.phone}</div>
            </td>
            <td>
                <div style={{ fontWeight: 500 }}>{order.address}</div>
            </td>
            <td>{order.payment}</td>
            <td>{Number(order.total_amount).toLocaleString()}</td>
            <td>{order.updated}</td>
            <td>
                <div className="d-flex flex-row gap-2">
                    <button className="btn btn-sm btn-primary" onClick={onView}>查看</button>
                    <button className="btn btn-sm btn-warning" onClick={onEdit}>編輯</button>
                </div>
            </td>
        </tr>
    );
}

function Return() {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orders, setOrders] = useState([]);
    const [searchOrderId, setSearchOrderId] = useState('');
    // 分頁
    const [currentPage, setCurrentPage] = useState(1);
    // 分頁幾筆到下一頁
    const pageSize = 8;
    // 新增訂單
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addOrderUserId, setAddOrderUserId] = useState('');
    const [addOrderLastName, setAddOrderLastName] = useState('');
    const [addOrderFirstName, setAddOrderFirstName] = useState('');
    const [addOrderPhone, setAddOrderPhone] = useState('');
    const [addOrderAddress, setAddOrderAddress] = useState('');
    const [addOrderPayment, setAddOrderPayment] = useState('信用卡');
    const [addOrderItems, setAddOrderItems] = useState([{ product_id: '', quantity: 1, size: '', color: '' }]);
    // 所有商品與使用者資料
    const [allProducts, setAllProducts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    // 計算新增訂單小計與總金額
    const [addOrderSubtotal, setAddOrderSubtotal] = useState(0);
    const [addOrderTotal, setAddOrderTotal] = useState(0);
    // 編輯訂單
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editOrder, setEditOrder] = useState(null);
    const [editOrderDate, setEditOrderDate] = useState('');
    const [editOrderIdSuffix, setEditOrderIdSuffix] = useState('');

    useEffect(() => {
        fetch('/api/v2/orders')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    // 轉換資料格式
                    const mapped = data.data.map(o => ({
                        order_id: o.order_id,
                        user_id: o.user_id,
                        name: o.recipient_last_name + o.recipient_first_name,
                        phone: o.recipient_phone,
                        address: o.shipping_address,
                        payment: o.payment_method,
                        subtotal: o.subtotal,
                        discount_amount: o.discount_amount,
                        total_amount: o.total_amount,
                        updated: o.updated_at ? new Date(o.updated_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/') : ''
                    }));
                    setOrders(mapped);
                }
            });
    }, []);

    useEffect(() => {
        fetch('/api/items')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllProducts(data);
            });
    }, []);

    useEffect(() => {
        fetch('/api/v2/admin/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllUsers(data);
            });
    }, []);

    useEffect(() => {
        // 計算小計和總金額
        let subtotal = 0;
        addOrderItems.forEach(item => {
            const prod = allProducts.find(p => p.product_id === item.product_id);
            if (prod && item.quantity > 0) {
                subtotal += Number(prod.price) * Number(item.quantity);
            }
        });
        setAddOrderSubtotal(subtotal);
        setAddOrderTotal(subtotal); // 目前無折扣
    }, [addOrderItems, allProducts]);

    const handleViewOrder = async (order) => {
        const res = await fetch(`/api/v2/admin/orders/${order.order_id}`);
        const data = await res.json();
        if (data.success && data.data) {
            setSelectedOrder({
                ...order,
                ...data.data,
                items: data.data.items || []
            });
            setModalVisible(true);
        }
    };

    const handleAddOrder = async () => {
        // 送出新增訂單 API
        const body = {
            user_id: addOrderUserId,
            recipient_last_name: addOrderLastName,
            recipient_first_name: addOrderFirstName,
            recipient_phone: addOrderPhone,
            shipping_address: addOrderAddress,
            payment_method: addOrderPayment,
            items: addOrderItems.map(item => {
                const prod = allProducts.find(p => p.product_id === item.product_id);
                return {
                    ...item,
                    price: prod ? prod.price : 0,
                    product_name: prod ? prod.name : ''
                };
            }),
            subtotal: addOrderSubtotal,
            total_amount: addOrderTotal
        };
        await fetch('/api/v2/admin/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        setAddModalVisible(false);
        setAddOrderUserId('');
        setAddOrderLastName('');
        setAddOrderFirstName('');
        setAddOrderPhone('');
        setAddOrderAddress('');
        setAddOrderPayment('信用卡');
        setAddOrderItems([{ product_id: '', quantity: 1, size: '', color: '' }]);
        // 可加 Toast 成功提示
    };

    const handleEditOrder = (order) => {
        setEditOrder(order);
        setEditOrderDate(order.updated);
        setEditOrderIdSuffix(order.order_id.slice(-6));
        setEditModalVisible(true);
    };

    const handleSaveEditOrder = async () => {
        if (!editOrder) return;
        // 新訂單ID
        const newOrderId = editOrder.order_id.slice(0, -6) + editOrderIdSuffix;
        // 更新 API
        await fetch(`/api/v2/admin/orders/${editOrder.order_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: newOrderId, updated_at: editOrderDate })
        });
        setOrders(orders => orders.map(o => o.order_id === editOrder.order_id ? { ...o, order_id: newOrderId, updated: editOrderDate } : o));
        setEditModalVisible(false);
        setEditOrder(null);
    };

    const totalPages = Math.ceil(orders.length / pageSize);
    const pagedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <>
            <div className="col-md-10 col-12" style={{ padding: '10px' }}>
                <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 32 }}>訂單管理</h2>
                <div className="d-flex align-items-center mb-4" style={{ gap: 16 }}>
                    <div className="input-group" style={{ width: 240, maxWidth: '100%' }}>
                        <span className="input-group-text bg-white border-end-0 p-2" style={{ borderRadius: 'unset' }}>
                            <img src={'/icon/search.svg'} alt="搜尋" width={16} height={16} style={{ display: 'block' }} />
                        </span>
                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="請輸入訂單號碼"
                            style={{ boxShadow: 'none', borderRadius: 'unset' }}
                            value={searchOrderId}
                            onChange={e => setSearchOrderId(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => setAddModalVisible(true)}>
                        新增訂單
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ background: '#fff', overflow: 'hidden', width: '99%' }}>
                        <thead style={{ background: '#f2f3f5' }}>
                            <tr>
                                <th style={{ fontWeight: 300 }}>訂單號碼</th>
                                <th style={{ fontWeight: 300 }}>手機電話</th>
                                <th style={{ fontWeight: 300 }}>地址</th>
                                <th style={{ fontWeight: 300 }}>付款方式</th>
                                <th style={{ fontWeight: 300 }}>總金額</th>
                                <th style={{ fontWeight: 300 }}>建立訂單日期</th>
                                <th style={{ fontWeight: 300 }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedOrders
                                .filter(order =>
                                    !searchOrderId || order.order_id.includes(searchOrderId)
                                )
                                .map(order => (
                                    <OrderRow key={order.order_id} order={order} onView={() => handleViewOrder(order)} onEdit={() => handleEditOrder(order)} />
                                ))}
                        </tbody>
                    </table>
                </div>
                <nav className="mt-4" aria-label="Page navigation">
                    <ul className="pagination justify-content-center" style={{ background: 'transparent' }}>
                        <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}
                            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                            <span className="page-link" style={{ color: currentPage === 1 ? '#888' : '#0070f3', background: 'transparent', border: 'none', fontWeight: 500 }}>
                                &lt; Previous
                            </span>
                        </li>
                        {Array.from({ length: totalPages }).map((_, i) => {
                            const page = i + 1;
                            if (
                                page === 1 ||
                                page === totalPages ||
                                Math.abs(page - currentPage) <= 2
                            ) {
                                return (
                                    <li key={page} className={`page-item${page === currentPage ? ' active' : ''}`} style={{ cursor: 'pointer' }}
                                        onClick={() => setCurrentPage(page)}>
                                        <span className="page-link" style={{ color: page === currentPage ? '#1a237e' : '#1976d2', background: page === currentPage ? '#bcd6ff' : 'transparent', border: 'none', fontWeight: page === currentPage ? 700 : 500 }}>
                                            {page}
                                        </span>
                                    </li>
                                );
                            }
                            if (
                                (page === currentPage - 3 && page > 1) ||
                                (page === currentPage + 3 && page < totalPages)
                            ) {
                                return (
                                    <li key={page} className="page-item disabled">
                                        <span className="page-link" style={{ background: 'transparent', border: 'none', color: '#888' }}>...</span>
                                    </li>
                                );
                            }
                            return null;
                        })}
                        <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}
                            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                            <span className="page-link" style={{ color: currentPage === totalPages ? '#888' : '#0070f3', background: 'transparent', border: 'none', fontWeight: 500 }}>
                                Next &gt;
                            </span>
                        </li>
                    </ul>
                </nav>
            </div>

            {modalVisible && selectedOrder && (
                <div className="modal show" style={{ display: 'block', zIndex: 2000, background: 'rgba(0,0,0,0.3)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">查看訂單內容</h5>
                                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row" style={{ minHeight: 320 }}>
                                    {/* 左側 運送資訊 */}
                                    <div className="col-md-5 col-12" style={{ borderRight: '1px solid #eee', paddingRight: 16 }}>
                                        <h6 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>運送資訊</h6>
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item"><strong>訂單編號：</strong>{selectedOrder.order_id}</li>
                                            <li className="list-group-item"><strong>會員id：</strong>{selectedOrder.user_id}</li>
                                            <li className="list-group-item"><strong>會員姓名：</strong>{selectedOrder.name}</li>
                                            <li className="list-group-item"><strong>手機電話：</strong>{selectedOrder.phone}</li>
                                            <li className="list-group-item"><strong>地址：</strong>{selectedOrder.address}</li>
                                            <li className="list-group-item"><strong>付款方式：</strong>{selectedOrder.payment}</li>
                                        </ul>
                                    </div>
                                    {/* 右側 商品資料 */}
                                    <div className="col-md-7 col-12" style={{ maxHeight: 400, overflowY: 'auto', paddingLeft: 16 }}>
                                        <div className="mb-2">
                                            <h6 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>商品資訊</h6>
                                            <table className="table table-bordered mt-2">
                                                <thead>
                                                    <tr>
                                                        <th className="text-center align-middle">商品名稱</th>
                                                        <th className="text-center align-middle">尺寸</th>
                                                        <th className="text-center align-middle">顏色</th>
                                                        <th className="text-center align-middle">單價</th>
                                                        <th className="text-center align-middle">數量</th>
                                                        <th className="text-center align-middle">圖片</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedOrder.items.map((item, idx) => (
                                                        <tr key={`${item.product_id || ''}-${item.size || ''}-${item.color || ''}-${item.id || idx}`}>
                                                            <td className="text-center align-middle">{item.product_name}</td>
                                                            <td className="text-center align-middle">{item.size}</td>
                                                            <td className="text-center align-middle">{item.color}</td>
                                                            <td className="text-center align-middle">{Number(item.price).toLocaleString()}</td>
                                                            <td className="text-center align-middle">{item.quantity}</td>
                                                            <td className="text-center align-middle">{item.image_url && <img src={item.image_url} alt="商品圖" style={{ width: 48, height: 48, objectFit: 'contain' }} />}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* 金額資訊 */}
                                        <div className="mt-3">
                                            <ul className="list-group list-group-flush">
                                                <li className="list-group-item d-flex justify-content-between px-2">
                                                    <strong>小計：</strong>
                                                    <span>{Number(selectedOrder.subtotal).toLocaleString()}</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between px-2">
                                                    <strong>折扣金額：</strong>
                                                    <span>{Number(selectedOrder.discount_amount).toLocaleString()}</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between px-2">
                                                    <strong>總金額：</strong>
                                                    <span>{Number(selectedOrder.total_amount).toLocaleString()}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setModalVisible(false)}>關閉</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 新增訂單 */}
            {addModalVisible && (
                <div className="modal show" style={{ display: 'block', zIndex: 2100, background: 'rgba(0,0,0,0.3)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">新增訂單</h5>
                                <button type="button" className="btn-close" onClick={() => setAddModalVisible(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row" style={{ minHeight: 320 }}>
                                    {/* 左側 會員資訊 */}
                                    <div className="col-md-5 col-12" style={{ borderRight: '1px solid #eee', paddingRight: 16 }}>
                                        <h6 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>會員資訊</h6>
                                        <div className="mb-3">
                                            <label className="form-label">會員ID</label>
                                            <select className="form-select" value={addOrderUserId} onChange={e => {
                                                const val = e.target.value;
                                                setAddOrderUserId(val);
                                                const user = allUsers.find(u => u.user_id === val);
                                                setAddOrderLastName(user ? user.last_name : '');
                                                setAddOrderFirstName(user ? user.first_name : '');
                                            }}>
                                                <option value="">請選擇會員</option>
                                                {allUsers.map(u => (
                                                    <option key={u.user_id} value={u.user_id}>{u.user_id} {u.username || ''} {u.email || ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">會員姓</label>
                                            <input type="text" className="form-control" value={addOrderLastName} onChange={e => setAddOrderLastName(e.target.value)} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">會員名</label>
                                            <input type="text" className="form-control" value={addOrderFirstName} onChange={e => setAddOrderFirstName(e.target.value)} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">手機電話</label>
                                            <input type="text" className="form-control" maxLength={10} value={addOrderPhone} onChange={e => {
                                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                                setAddOrderPhone(val);
                                            }} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">地址</label>
                                            <input type="text" className="form-control" value={addOrderAddress} onChange={e => setAddOrderAddress(e.target.value)} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">付款方式</label>
                                            <select className="form-select" value={addOrderPayment} onChange={e => setAddOrderPayment(e.target.value)}>
                                                <option value="信用卡">信用卡</option>
                                                <option value="貨到付款">貨到付款</option>
                                                <option value="ATM轉帳">ATM轉帳</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* 右側 商品選擇 */}
                                    <div className="col-md-7 col-12" style={{ maxHeight: 400, overflowY: 'auto', paddingLeft: 16 }}>
                                        <h6 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>商品選擇</h6>
                                        {addOrderItems.map((item, idx) => {
                                            const prod = allProducts.find(p => p.product_id === item.product_id);
                                            return (
                                                <div key={idx} className="border rounded p-2 mb-2">
                                                    <div className="row g-2 align-items-center">
                                                        <div className="col-md-4">
                                                            <select className="form-select" value={item.product_id} onChange={e => {
                                                                const val = e.target.value;
                                                                setAddOrderItems(items => items.map((it, i) => i === idx ? { ...it, product_id: val } : it));
                                                            }}>
                                                                <option value="">選擇商品</option>
                                                                {allProducts.map(p => (
                                                                    <option key={p.product_id} value={p.product_id}>{p.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-2">
                                                            <input type="number" className="form-control" min={1} value={item.quantity} onChange={e => {
                                                                const val = Number(e.target.value);
                                                                setAddOrderItems(items => items.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                                                            }} />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <select className="form-select" value={item.size} onChange={e => {
                                                                const val = e.target.value;
                                                                setAddOrderItems(items => items.map((it, i) => i === idx ? { ...it, size: val } : it));
                                                            }}>
                                                                <option value="">尺寸</option>
                                                                {(prod?.sizes || []).map(sz => (
                                                                    <option key={sz} value={sz}>{sz}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-2">
                                                            <select className="form-select" value={item.color} onChange={e => {
                                                                const val = e.target.value;
                                                                setAddOrderItems(items => items.map((it, i) => i === idx ? { ...it, color: val } : it));
                                                            }}>
                                                                <option value="">顏色</option>
                                                                {(prod?.colors || []).map(c => (
                                                                    <option key={c.name} value={c.name}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="col-md-2">
                                                            <button className="btn btn-danger btn-sm" onClick={() => setAddOrderItems(items => items.filter((_, i) => i !== idx))}>移除</button>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 ms-1" style={{ fontSize: 14, color: '#1976d2' }}>
                                                        {prod ? `單價：${Number(prod.price).toLocaleString()} 元` : ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button className="btn btn-success" onClick={() => setAddOrderItems(items => [...items, { product_id: '', quantity: 1, size: '', color: '' }])}>新增商品</button>
                                        <div className="mt-4">
                                            <ul className="list-group list-group-flush">
                                                <li className="list-group-item d-flex justify-content-between px-2">
                                                    <strong>小計：</strong>
                                                    <span>{Number(addOrderSubtotal).toLocaleString()} 元</span>
                                                </li>
                                                <li className="list-group-item d-flex justify-content-between px-2">
                                                    <strong>總金額：</strong>
                                                    <span>{Number(addOrderTotal).toLocaleString()} 元</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setAddModalVisible(false)}>取消</button>
                                <button type="button" className="btn btn-primary" onClick={handleAddOrder}>送出訂單</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 編輯訂單 */}
            {editModalVisible && editOrder && (
                <div className="modal show" style={{ display: 'block', zIndex: 2200, background: 'rgba(0,0,0,0.3)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">編輯訂單</h5>
                                <button type="button" className="btn-close" onClick={() => setEditModalVisible(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">訂單ID後6碼</label>
                                    <input type="text" className="form-control" maxLength={6} value={editOrderIdSuffix} onChange={e => setEditOrderIdSuffix(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">建立訂單日期</label>
                                    <input type="date" className="form-control" value={editOrderDate} onChange={e => setEditOrderDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setEditModalVisible(false)}>取消</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveEditOrder}>儲存</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Return;

// =============================================
// 管理者新增訂單 API（不走購物車、不用綠界）
// =============================================
router.post('/api/v2/admin/orders', async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { user_id, recipient_last_name, recipient_first_name, recipient_phone, shipping_address, payment_method, items = [] } = req.body;
    if (!user_id || !recipient_last_name || !recipient_first_name || !recipient_phone || !shipping_address || !payment_method || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: '缺少必要欄位或商品明細' });
    }
    function generateOrderId() {
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const now = new Date();
      const dateStr = String(now.getFullYear()).slice(2, 4) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
      return rand + dateStr;
    }
    const newOrderId = generateOrderId();
    let subtotal = 0;
    for (const item of items) {
      const [productRows] = await connection.query('SELECT price FROM products WHERE product_id = ?', [item.product_id]);
      if (productRows.length > 0) {
        subtotal += Number(productRows[0].price) * Number(item.quantity);
      }
    }
    await connection.query(
      `INSERT INTO orders (
        order_id, user_id, order_date, status,
        recipient_last_name, recipient_first_name, recipient_phone, shipping_address, payment_method,
        subtotal, discount_amount, total_amount
      ) VALUES (?, ?, NOW(), 'processing', ?, ?, ?, ?, ?, ?, 0, ?)`,
      [newOrderId, user_id, recipient_last_name, recipient_first_name, recipient_phone, shipping_address, payment_method, subtotal, subtotal]
    );
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, size, color, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          newOrderId,
          item.product_id,
          item.product_name || '',
          item.size || '',
          item.color || '',
          item.price || 0,
          item.quantity || 1
        ]
      );
    }
    await connection.commit();
    res.json({ success: true, message: '訂單新增成功', order_id: newOrderId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});


// 放後端程式碼的地方
// =============================================
// 管理者編輯訂單（訂單ID與日期）
// =============================================
router.put('/api/v2/admin/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const { order_id: newOrderId, updated_at } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // 查詢原訂單
    const [[order]] = await connection.query('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: '找不到訂單' });
    }
    // 1. 複製 orders 主表資料到新 order_id
    await connection.query(
      `INSERT INTO orders (
        order_id, user_id, order_date, status, recipient_last_name, recipient_first_name, recipient_phone, shipping_address, postal_code, payment_method, subtotal, discount_amount, total_amount, ecpay_merchant_trade_no, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderId,
        order.user_id,
        order.order_date,
        order.status,
        order.recipient_last_name,
        order.recipient_first_name,
        order.recipient_phone,
        order.shipping_address,
        order.postal_code,
        order.payment_method,
        order.subtotal,
        order.discount_amount,
        order.total_amount,
        order.ecpay_merchant_trade_no,
        updated_at
      ]
    );
    // 2. 更新 order_items 的 order_id
    await connection.query('UPDATE order_items SET order_id = ? WHERE order_id = ?', [newOrderId, orderId]);
    // 3. 刪除原訂單（舊 order_id）
    await connection.query('DELETE FROM orders WHERE order_id = ?', [orderId]);
    await connection.commit();
    res.json({ success: true, message: '訂單已更新', order_id: newOrderId });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// =============================================
// 管理者取得所有會員（不需認證）
// =============================================
router.get('/api/v2/admin/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});