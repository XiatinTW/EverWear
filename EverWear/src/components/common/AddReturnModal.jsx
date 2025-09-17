import React from "react";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

function AddReturnModal({ show, onHide, form, onFormChange, onItemChange, onItemCheck, onShipmentChange, onSubmit, ordersList, selectedOrderId, setSelectedOrderId, allSizes, allColors, selectedOrder }) {
    return (
        <Modal show={show} onHide={onHide} size="xl">
            <Modal.Header closeButton>
                <Modal.Title>新增退換貨申請</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="row">
                    <div className="col-md-4">
                        <div className="mb-3">
                            <label>訂單選擇</label>
                            <input
                                className="form-control"
                                list="orderIdList"
                                value={selectedOrderId}
                                onChange={e => setSelectedOrderId(e.target.value)}
                                placeholder="請輸入或選擇訂單號碼"
                            />
                            <datalist id="orderIdList">
                                {ordersList.map(o => (
                                    <option key={o.order_id} value={o.order_id}>
                                        {o.order_id} / {o.user_id} / {o.order_date ? o.order_date.slice(0,10) : ''} / ${o.total_amount}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                        <div className="mb-3">
                            <label>申請類型</label>
                            <select className="form-select" name="type" value={form.type} onChange={onFormChange}>
                                <option value="return">退貨</option>
                                <option value="exchange">換貨</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>申請原因</label>
                            <input className="form-control" name="reason" value={form.reason} onChange={onFormChange} />
                        </div>
                        <div className="mb-3">
                            <label>管理員備註</label>
                            <input className="form-control" name="admin_note" value={form.admin_note} onChange={onFormChange} />
                        </div>
                        <div className="mb-3">
                            <label>物流公司</label>
                            <input className="form-control" name="courier" value={form.shipment.courier} onChange={onShipmentChange} />
                        </div>
                        <div className="mb-3">
                            <label>物流單號</label>
                            <input className="form-control" name="tracking_number" value={form.shipment.tracking_number} onChange={onShipmentChange} />
                        </div>
                        <div className="mb-3">
                            <label>物流狀態</label>
                            <select className="form-select" name="status" value={form.shipment.status} onChange={onShipmentChange}>
                                <option value="created">已建立</option>
                                <option value="in_transit">運送中</option>
                                <option value="delivered">已送達</option>
                                <option value="returned">已退回</option>
                                <option value="cancelled">已取消</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label>物流類型</label>
                            <select className="form-select" name="shipment_type" value={form.shipment.shipment_type} onChange={onShipmentChange}>
                                <option value="customer_send">客戶寄出</option>
                                <option value="merchant_send">商家寄出</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-md-8">
                        {selectedOrder && (
                            <>
                                <div className="mb-3">
                                    <label>會員資訊</label>
                                    <ul className="list-group mb-2">
                                        <li className="list-group-item">會員ID：{selectedOrder.user_id}</li>
                                        <li className="list-group-item">姓名：{selectedOrder.recipient_last_name}{selectedOrder.recipient_first_name}</li>
                                        <li className="list-group-item">電話：{selectedOrder.recipient_phone}</li>
                                        <li className="list-group-item">地址：{selectedOrder.shipping_address}</li>
                                    </ul>
                                </div>
                                <div className="mb-3">
                                    <label>訂單商品</label>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>選擇</th>
                                                <th>商品名稱</th>
                                                <th>尺寸</th>
                                                <th>顏色</th>
                                                <th>數量</th>
                                                <th>退換貨原因</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.items.map((item, idx) => (
                                                <tr key={item.order_item_id} style={item.exchange_to_color ? { background: '#e6ffe6' } : {}}>
                                                    <td><input type="checkbox" checked={item.checked || false} onChange={e => onItemCheck(idx, e.target.checked)} /></td>
                                                    <td>{item.product_name}</td>
                                                    <td>
                                                        {item.size}
                                                        <div className="mt-1">
                                                            <select className="form-select" value={item.exchange_to_size || ''} onChange={e => onItemChange(idx, 'exchange_to_size', e.target.value)}>
                                                                <option value="">換貨尺寸</option>
                                                                {allSizes.map(sz => (
                                                                    <option key={sz} value={sz}>{sz}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {item.color}
                                                        <div className="mt-1">
                                                            <select className="form-select" value={item.exchange_to_color || ''} onChange={e => onItemChange(idx, 'exchange_to_color', e.target.value)}>
                                                                <option value="">換貨顏色</option>
                                                                {allColors.map(c => (
                                                                    <option key={c.name + c.hex_code} value={c.name}>{c.name}</option>
                                                                ))}
                                                            </select>
                                                            {item.exchange_to_color && (
                                                                <div style={{ color: 'red', fontSize: 13, marginTop: 2 }}>換貨顏色：{item.exchange_to_color}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td><input className="form-control" style={{ width: 60 }} type="number" value={item.quantity} onChange={e => onItemChange(idx, 'quantity', e.target.value)} /></td>
                                                    <td><input className="form-control" value={item.reason || ''} onChange={e => onItemChange(idx, 'reason', e.target.value)} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>取消</Button>
                <Button variant="primary" onClick={onSubmit}>送出申請</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AddReturnModal;