import React, { useState, useEffect } from "react";
import Toast from '../../components/common/Toast';

function OrderRow({ order, onView }) {
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
    const [orderIdSortAsc, setOrderIdSortAsc] = useState(true);

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

    const handleSortOrderId = () => {
        setOrderIdSortAsc(v => !v);
    };

    const totalPages = Math.ceil(orders.length / pageSize);
    const sortedOrders = [...orders].sort((a, b) => {
        if (orderIdSortAsc) {
            return a.order_id.localeCompare(b.order_id, undefined, { numeric: true });
        } else {
            return b.order_id.localeCompare(a.order_id, undefined, { numeric: true });
        }
    });
    const pagedOrders = sortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ background: '#fff', overflow: 'hidden', width: '99%' }}>
                        <thead style={{ background: '#f2f3f5' }}>
                            <tr>
                                <th style={{ fontWeight: 300, cursor: 'pointer' }} onClick={handleSortOrderId}>
                                    訂單號碼
                                    <span style={{ marginLeft: 6, fontSize: 14, display: 'inline-block', verticalAlign: 'middle', transition: 'transform 0.2s', transform: orderIdSortAsc ? 'rotate(180deg)' : 'none' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8.16663 12.0001L12.1666 8.00008M8.16663 3.66675V12.0001V3.66675ZM8.16663 12.0001L4.16663 8.00008L8.16663 12.0001Z" stroke="#21272A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </span>
                                </th>
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
                                    <OrderRow key={order.order_id} order={order} onView={() => handleViewOrder(order)} />
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
        </>
    )
}

export default Return;