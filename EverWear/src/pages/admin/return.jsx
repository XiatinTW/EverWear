import React, { useState, useEffect } from "react";
import Toast from '../../components/common/Toast';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import AddReturnModal from '../../components/common/AddReturnModal';
import EditReturnModal from '../../components/common/EditReturnModal';

const statusMap = {
    created: '已建立',
    in_transit: '運送中',
    delivered: '已送達',
    returned: '已退回',
    cancelled: '已取消',
    pending: '待處理',
    approved: '已核准',
    rejected: '已拒絕',
    processing: '處理中',
    completed: '已完成'
};

function OrderRow({ order, onEdit }) {
    return (
        <tr>
            <td>
                <div style={{ fontWeight: 500 }}>{order.order_id}</div>
            </td>
            <td>
                <div style={{ fontWeight: 500 }}>{order.request_date ? order.request_date.slice(0,10) : ''}</div>
            </td>
            <td>
                <div style={{ fontWeight: 500 }}>{order.reason}</div>
            </td>
            <td>{order.amount || order.total_amount || '-'}</td>
            <td>{order.type === 'exchange' ? '換貨' : '退貨'}</td>
            <td>{statusMap[order.status] || order.status}</td>
            <td>
                <div className="d-flex flex-row gap-2">
                    <button className="btn btn-sm btn-primary" onClick={() => onEdit(order)}>編輯</button>
                </div>
            </td>
        </tr>
    );
}

function Return() {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [ordersList, setOrdersList] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [form, setForm] = useState({
        user_id: '',
        type: 'return',
        reason: '',
        admin_note: '',
        items: [],
        shipment: {
            courier: '',
            tracking_number: '',
            status: 'created',
            shipment_type: 'customer_send',
        }
    });
    const [userOrders, setUserOrders] = useState([]);
    const [userIdInput, setUserIdInput] = useState('');
    const [allColors, setAllColors] = useState([]);
    const [allSizes, setAllSizes] = useState([]);
    const [orders, setOrders] = useState([]);
    const [editOrder, setEditOrder] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    const [toast, setToast] = useState(null);

    useEffect(() => {
        axios.get('/api/v2/order_returns').then(res => {
            setOrders(res.data.data || []);
        });
        axios.get('/api/v2/orders').then(res => {
            setOrdersList(res.data.data || []);
        });
    }, []);

    useEffect(() => {
        if (selectedOrderId && !editOrder && showAddModal) { // 只有新增時才更新 form.items
            axios.get(`/api/v2/admin/orders/${selectedOrderId}`).then(res => {
                setSelectedOrder(res.data.data);
                setForm(f => ({ ...f, items: res.data.data.items.map(i => ({
                    order_item_id: i.id,
                    product_id: i.product_id,
                    product_name: i.product_name,
                    size: i.size,
                    color: i.color,
                    quantity: i.quantity,
                    reason: '',
                    exchange_to_size: '',
                    exchange_to_color: '',
                    processed: 0,
                    checked: false
                })) }));
                setForm(f => ({ ...f, user_id: res.data.data.user_id }));
                // 查詢同名商品的顏色
                if (res.data.data.items.length > 0) {
                    const name = res.data.data.items[0].product_name;
                    axios.get(`/api/items/byname?name=${encodeURIComponent(name)}`).then(r => {
                        const colorSet = new Set();
                        r.data.forEach(prod => {
                            prod.colors.forEach(c => colorSet.add(JSON.stringify(c)));
                        });
                        let colorsArr = Array.from(colorSet).map(s => JSON.parse(s));
                        if (form.items && form.items.length > 0) {
                            form.items.forEach(item => {
                                if (item.exchange_to_color && !colorsArr.some(c => c.name === item.exchange_to_color)) {
                                    colorsArr.push({ name: item.exchange_to_color, hex_code: '' });
                                }
                            });
                        }
                        setAllColors(colorsArr);
                        const sizeSet = new Set();
                        r.data.forEach(prod => {
                            prod.sizes.forEach(sz => sizeSet.add(sz));
                        });
                        setAllSizes(Array.from(sizeSet));
                    });
                }
            });
        }
    }, [selectedOrderId, editOrder, showAddModal]);

    const handleShowAddModal = () => {
        setEditOrder(null);
        setShowAddModal(true);
        setShowEditModal(false);
    };
    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setSelectedOrderId('');
        setSelectedOrder(null);
        setForm({
            user_id: '',
            type: 'return',
            reason: '',
            admin_note: '',
            items: [],
            shipment: {
                courier: '',
                tracking_number: '',
                status: 'created',
                shipment_type: 'customer_send',
            }
        });
    };
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditOrder(null);
        setSelectedOrderId('');
        setSelectedOrder(null);
        setForm({
            user_id: '',
            type: 'return',
            reason: '',
            admin_note: '',
            items: [],
            shipment: {
                courier: '',
                tracking_number: '',
                status: 'created',
                shipment_type: 'customer_send',
            }
        });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };
    const handleItemChange = (idx, field, value) => {
        setForm(f => ({
            ...f,
            items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
        }));
    };
    const handleItemCheck = (idx, checked) => {
        setForm(f => ({
            ...f,
            items: f.items.map((item, i) => i === idx ? { ...item, checked } : item)
        }));
    };
    const handleShipmentChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, shipment: { ...f.shipment, [name]: value } }));
    };
    const handleSubmit = async () => {
        const selectedItems = form.items.filter(i => i.checked);
        if (!selectedOrderId || !form.user_id || !form.type || selectedItems.length === 0) {
            setToast({ message: '請填寫完整資料並選擇商品', type: 'error' });
            return;
        }
        const payload = {
            order_id: selectedOrderId,
            user_id: form.user_id,
            type: form.type,
            reason: form.reason,
            admin_note: form.admin_note,
            items: selectedItems,
            shipment: form.shipment
        };
        try {
            if (editOrder) {
                await axios.patch(`/api/v2/order_returns/${editOrder.return_id}`, payload);
                setToast({ message: '編輯已送出', type: 'success' });
                setEditOrder(null);
                setShowEditModal(false);
                const res = await axios.get('/api/v2/order_returns');
                setOrders(res.data.data || []);
            } else {
                await axios.post('/api/v2/order_returns', payload);
                setToast({ message: '申請已送出', type: 'success' });
                setShowAddModal(false);
            }
        } catch (err) {
            setToast({ message: '申請失敗', type: 'error' });
        }
    };

    const handleEditOrder = async (order) => {
        const res = await axios.get(`/api/v2/order_returns/${order.return_id}`);
        setEditOrder(res.data.data);
        setShowEditModal(true);
        setShowAddModal(false);
        // 直接用退換貨申請的 items
        let items = res.data.data.items.map(i => ({
            order_item_id: i.order_item_id,
            product_id: i.product_id,
            product_name: i.product_name || '',
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            reason: i.reason || '',
            exchange_to_size: i.exchange_to_size || '',
            exchange_to_color: i.exchange_to_color || '',
            processed: i.processed || 0,
            checked: true
        }));
        // 逐筆查詢商品名稱（只補空的）
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx];
            if (!item.product_name && item.product_id) {
                try {
                    const prodRes = await axios.get(`/api/items?product_id=${item.product_id}`);
                    if (prodRes.data && prodRes.data.length > 0) {
                        items[idx].product_name = prodRes.data[0].name;
                    }
                } catch (err) {
                    // 查不到就不補
                }
            }
        }
        setForm(f => ({
            ...f,
            user_id: res.data.data.user_id,
            type: res.data.data.type,
            reason: res.data.data.reason,
            admin_note: res.data.data.admin_note,
            items,
            shipment: res.data.data.shipments[0] || {
                courier: '',
                tracking_number: '',
                status: 'created',
                shipment_type: 'customer_send',
            }
        }));
        setSelectedOrderId(res.data.data.order_id);
        const orderRes = await axios.get(`/api/v2/admin/orders/${res.data.data.order_id}`);
        setSelectedOrder(orderRes.data.data);
        if (items.length > 0 && items[0].product_name) {
            const name = items[0].product_name;
            axios.get(`/api/items/byname?name=${encodeURIComponent(name)}`).then(r => {
                const colorSet = new Set();
                r.data.forEach(prod => {
                    prod.colors.forEach(c => colorSet.add(JSON.stringify(c)));
                });
                let colorsArr = Array.from(colorSet).map(s => JSON.parse(s));
                items.forEach(item => {
                    if (item.exchange_to_color && !colorsArr.some(c => c.name === item.exchange_to_color)) {
                        colorsArr.push({ name: item.exchange_to_color, hex_code: '' });
                    }
                });
                setAllColors(colorsArr);
                const sizeSet = new Set();
                r.data.forEach(prod => {
                    prod.sizes.forEach(sz => sizeSet.add(sz));
                });
                setAllSizes(Array.from(sizeSet));
            });
        }
    };

    const totalPages = Math.ceil(orders.length / pageSize);
    const pagedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <>
            <div className="col-md-10 col-12" style={{ padding: '10px' }}>
                <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 32 }}>退換貨列表</h2>
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
                            disabled
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleShowAddModal}>
                        新增訂單處理
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ background: '#fff', overflow: 'hidden', width: '99%' }}>
                        <thead style={{ background: '#f2f3f5' }}>
                            <tr>
                                <th style={{ fontWeight: 300 }}>訂單號碼</th>
                                <th style={{ fontWeight: 300 }}>提出退換貨日期</th>
                                <th style={{ fontWeight: 300 }}>理由</th>
                                <th style={{ fontWeight: 300 }}>訂單金額</th>
                                <th style={{ fontWeight: 300 }}>申請類型</th>
                                <th style={{ fontWeight: 300 }}>狀態</th>
                                <th style={{ fontWeight: 300 }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedOrders.map((order, idx) => (
                                <OrderRow key={`${order.return_id}_${idx}`} order={order} onEdit={handleEditOrder} />
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* 分頁元件移除動態分頁，改為靜態顯示 */}
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
            {/* 彈窗表單 */}
            <AddReturnModal
                show={showAddModal}
                onHide={handleCloseAddModal}
                form={form}
                onFormChange={handleFormChange}
                onItemChange={handleItemChange}
                onItemCheck={handleItemCheck}
                onShipmentChange={handleShipmentChange}
                onSubmit={handleSubmit}
                ordersList={ordersList}
                selectedOrderId={selectedOrderId}
                setSelectedOrderId={setSelectedOrderId}
                allSizes={allSizes}
                allColors={allColors}
                selectedOrder={selectedOrder}
            />
            <EditReturnModal
                show={showEditModal}
                onHide={handleCloseEditModal}
                form={form}
                onFormChange={handleFormChange}
                onItemChange={handleItemChange}
                onItemCheck={handleItemCheck}
                onShipmentChange={handleShipmentChange}
                onSubmit={handleSubmit}
                allSizes={allSizes}
                allColors={allColors}
                selectedOrder={selectedOrder}
            />
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    )
}

export default Return;