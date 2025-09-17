// 商品管理頁面
// 使用 React + TypeScript + Bootstrap + Redux
import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SketchPicker } from 'react-color'; // 安裝 react-color
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import 'bootstrap/dist/css/bootstrap.min.css'; // 套用 bootstrap 樣式
import Toast from '../../components/common/Toast';

// 在檔案最前面加上這行，設定 axios 預設 baseURL
axios.defaults.baseURL = 'http://localhost:3000';

const sizeOptions = ['S', 'M', 'L'];

function ItemCreate() {
  // 分頁狀態
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 7; // 每頁顯示商品數量，可依需求調整
  const navigate = useNavigate();
  // TypeScript: const [items, setItems] = React.useState<any[]>([]);
  const [items, setItems] = React.useState([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  // 用 useState 管理表單資料
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    description_long: '',
    charactor: '',
    material: '',
    size_url: '',
    price: '',
    category_id: '',
  });
  const [imageUrl, setImageUrl] = React.useState(null);
  const [colorName, setColorName] = React.useState('');
  const [colorHex, setColorHex] = React.useState('#000000');
  const [images, setImages] = React.useState([]);
  const [sizes, setSizes] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [colorOptions, setColorOptions] = React.useState([]);
  const [allColors, setAllColors] = React.useState([]);
  const [search, setSearch] = React.useState('');

  // 新增：庫存設定
  const [stockList, setStockList] = React.useState([]);

  // 新增：表格尺寸選擇狀態
  const [selectedTableSize, setSelectedTableSize] = React.useState('');

  // 表格每個商品的尺寸選擇（key: product_id, value: size）
  const [tableSizeMap, setTableSizeMap] = React.useState({});

  // Toast 狀態
  const [toast, setToast] = React.useState(null);

  // 懸浮圖片商品 id
  const [hoveredProductId, setHoveredProductId] = React.useState(null);
  // 懸浮圖片座標
  const [hoverPos, setHoverPos] = React.useState({x: 0, y: 0});

  // 新增：膚色推薦服飾 Modal 狀態
  const [recommendModalVisible, setRecommendModalVisible] = React.useState(false);
  const [seasonList, setSeasonList] = React.useState([]);
  const [seasonColors, setSeasonColors] = React.useState({});
  const [allColorsMap, setAllColorsMap] = React.useState({});

  useEffect(() => {
    // 直接用 axios 取得商品
    axios.get('/api/items').then(res => {
      setItems(Array.isArray(res.data) ? res.data : []);
    });
    // 取得分類列表
    axios.get('/api/categories').then(res => {
      setCategories(Array.isArray(res.data) ? res.data : []);
    });
    // 取得所有顏色
    axios.get('/api/colors').then(res => {
      setAllColors(Array.isArray(res.data) ? res.data : []);
      // 建立 color_id 對應表
      const map = {};
      (Array.isArray(res.data) ? res.data : []).forEach(c => { map[c.color_id] = c; });
      setAllColorsMap(map);
    });
    // 取得所有季節
    axios.get('/api/seasons').then(res => {
      setSeasonList(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  // 取得同名稱商品的所有顏色
  React.useEffect(() => {
    if (formData.name) {
      axios.get(`/api/items/byname?name=${encodeURIComponent(formData.name)}`).then(res => {
        const colors = [];
        (Array.isArray(res.data) ? res.data : []).forEach(item => {
          if (Array.isArray(item.colors)) {
            item.colors.forEach(c => {
              if (!colors.find(x => x.name === c.name && x.hex_code === c.hex_code)) {
                colors.push({ name: c.name, hex_code: c.hex_code });
              }
            });
          }
        });
        setColorOptions(colors);
      });
    } else {
      setColorOptions([]);
    }
  }, [formData.name]);

  // 當尺寸或顏色變動時，重設庫存列表
  React.useEffect(() => {
    setStockList(sizes.map(sz => ({
      size: sz,
      quantity: 50 // 預設 50
    })));
  }, [sizes, colorName, colorHex]);

  const handleAdd = () => {
    setEditingItem(null);
    setImageUrl(null);
    setImages([]);
    setColorName('');
    setColorHex('#000000');
    setSizes([]);
    setFormData({
      name: '',
      description: '',
      description_long: '',
      charactor: '',
      material: '',
      size_url: '',
      price: '',
      category_id: '',
    });
    setModalVisible(true);
  };

  // 編輯時帶入庫存
  const handleEdit = async (item) => {
    let colorNameValue = '';
    if (Array.isArray(item.colors) && item.colors.length > 0) {
      colorNameValue = item.colors[0].name;
    } else {
      colorNameValue = item.color_name || '';
    }
    setEditingItem(item);
    setImageUrl(item.image);
    setImages(Array.isArray(item.images) ? item.images : []);
    // 修正：編輯時優先帶入 colors[0].name
    let colorNameValue2 = '';
    if (Array.isArray(item.colors) && item.colors.length > 0) {
      colorNameValue2 = item.colors[0].name;
    } else {
      colorNameValue2 = item.color_name || '';
    }
    setColorName(colorNameValue2);
    setColorHex(
      Array.isArray(item.colors) && item.colors.length > 0
        ? item.colors[0].hex_code
        : item.color_hex || '#000000'
    );
    setSizes(Array.isArray(item.sizes) ? item.sizes : []);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      description_long: item.description_long || '',
      charactor: item.charactor ? JSON.parse(item.charactor).join(',') : '',
      material: item.material ? JSON.parse(item.material).join(',') : '',
      size_url: item.size_url || '',
      price: typeof item.price === 'string' ? Number(item.price) : item.price,
      category_id: item.category_id || '',
    });

    // 取得庫存資料（依商品id、顏色id查詢）
    let colorId = '';
    // 取得 colorId
    if (Array.isArray(item.colors) && item.colors.length > 0) {
      try {
        const res = await axios.get('/api/colors');
        const found = res.data.find(
          (c) => c.name === colorNameValue && c.hex_code === (item.colors[0].hex_code || item.color_hex)
        );
        if (found) colorId = found.color_id;
      } catch {}
    }
    let stockRes = [];
    if (item.product_id && colorId) {
      try {
        const res = await axios.get(`/api/product_stock?product_id=${item.product_id}&color_id=${colorId}`);
        stockRes = Array.isArray(res.data) ? res.data : [];
      } catch {}
    }
    if (stockRes.length) {
      setStockList(stockRes.map(s => ({
        size: s.size_name,
        quantity: s.quantity
      })));
    } else if (Array.isArray(item.sizes)) {
      setStockList(item.sizes.map(sz => ({
        size: sz,
        quantity: 50
      })));
    }
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/items/${id}`);
    setItems(prev => prev.filter(i => i.product_id !== id));
    window.alert('商品已刪除');
  };

  const handleCopy = (item) => {
    // 複製商品資訊但不帶 product_id
    setEditingItem(null);
    setImageUrl(item.image);
    setImages(Array.isArray(item.images) ? item.images : []);
    let colorNameValue = '';
    if (Array.isArray(item.colors) && item.colors.length > 0) {
      colorNameValue = item.colors[0].name;
    } else {
      colorNameValue = item.color_name || '';
    }
    setColorName(colorNameValue);
    setColorHex(
      Array.isArray(item.colors) && item.colors.length > 0
        ? item.colors[0].hex_code
        : item.color_hex || '#000000'
    );
    setSizes(Array.isArray(item.sizes) ? item.sizes : []);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      description_long: item.description_long || '',
      charactor: item.charactor ? JSON.parse(item.charactor).join(',') : '',
      material: item.material ? JSON.parse(item.material).join(',') : '',
      size_url: item.size_url || '',
      price: typeof item.price === 'string' ? Number(item.price) : item.price,
      category_id: item.category_id || '',
    });
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      // 使用 formData 取代 form.validateFields()
      const charactor = JSON.stringify(formData.charactor.split(',').map((v) => v.trim()).filter(Boolean));
      const material = JSON.stringify(formData.material.split(',').map((v) => v.trim()).filter(Boolean));
      const payload = {
        ...formData,
        charactor,
        material,
        size_url: formData.size_url,
        color_name: colorName,
        color_hex: colorHex,
        images,
        sizes,
        stock: stockList, // 新增：庫存資訊
      };
      if (editingItem) {
        const res = await axios.put(`/api/items/${editingItem.product_id}`, payload);
        setItems(prev => prev.map(i => i.product_id === editingItem.product_id ? res.data : i));
        setToast({ message: '商品已更新', type: 'success' });
      } else {
        const res = await axios.post('/api/items', payload);
        setItems(prev => [...prev, res.data]);
        setToast({ message: '商品已新增', type: 'success' });
      }
      setModalVisible(false);
      // 重新取得商品列表
      const res = await axios.get('/api/items');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // 顯示後端錯誤訊息
      window.alert(err?.response?.data?.error || err.message || '操作失敗');
      console.error('[handleOk] 編輯/新增商品失敗:', err);
    }
  };

  // 多檔上傳
  // 圖片多檔上傳處理（如需使用，請將此函式整合到圖片上傳元件的 onChange/onUpload 事件）
  const handleMultiUpload = (info) => {
    if (info.file.status === 'done') {
      // 支援多張回傳
      const response = info.file.response;
      if (response.urls) {
        setImages(prev => [...prev, ...response.urls]);
      } else if (response.url) {
        setImages(prev => [...prev, response.url]);
      }
      window.alert('圖片上傳成功');
    }
  };

  // 新增：刪除圖片功能
  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // 新增：拖曳排序圖片
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newImages = Array.from(images);
    const [removed] = newImages.splice(result.source.index, 1);
    newImages.splice(result.destination.index, 0, removed);
    setImages(newImages);
  };

  // 商品搜尋過濾：同時支援品項名稱與類別名稱
  const filteredItems = items.filter(item => {
    const cat = categories.find(c => c.category_id === item.category_id);
    const nameMatch = item.name?.toLowerCase().includes(search.toLowerCase());
    const catMatch = cat?.name?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || catMatch;
  });

  // 分頁資料
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      title: '品項',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div>
          {text}
          <div style={{ fontSize: 12, color: '#888' }}>{record.product_id}</div>
        </div>
      ),
    },
    {
      title: '顏色',
      key: 'color_name',
      render: (_, record) => {
        // 顯示顏色名稱
        let colorName = '';
        let colorHex = '';
        if (Array.isArray(record.colors) && record.colors.length > 0) {
          colorName = record.colors[0].name;
          colorHex = record.colors[0].hex_code;
        } else {
          colorName = record.color_name || '';
          colorHex = record.color_hex || '';
        }
        // 顯示英文顏色（如 DarkGreen），若有 hex_code
        let colorEn = '';
        if (Array.isArray(record.colors) && record.colors.length > 0) {
          colorEn = record.colors[0].en_name || record.colors[0].name;
        } else {
          colorEn = record.color_en || '';
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 色塊 */}
            {colorHex && (
              <span
                style={{
                  display: 'inline-block',
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: colorHex,
                  border: '1px solid #eee',
                  verticalAlign: 'middle'
                }}
              />
            )}
            <div>
              {colorName}
              <div style={{ fontSize: 12, color: '#888' }}>{colorEn}</div>
            </div>
          </div>
        );
      }
    },
    {
      title: '尺寸',
      key: 'sizes',
      render: (_, record) => {
        const sizes = Array.isArray(record.sizes) ? record.sizes : ['S'];
        const selectedSize = tableSizeMap[record.product_id] || sizes[0];
        return (
          <select
            className="form-select"
            style={{ width: 60 }}
            value={selectedSize}
            onChange={e => {
              const val = e.target.value;
              setTableSizeMap(prev => ({
                ...prev,
                [record.product_id]: val
              }));
            }}
          >
            {sizes.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        );
      }
    },
    {
      title: '價格',
      dataIndex: 'price',
      key: 'price',
      render: (v) => Math.round(v)
    },
    {
      title: '類別',
      dataIndex: 'category_id',
      key: 'category_id',
      render: (id, record) => {
        // 顯示分類名稱
        const cat = categories.find(c => c.category_id === id);
        return cat ? cat.name : id;
      }
    },
    {
      title: '庫存數',
      key: 'stock',
      render: (_, record) => {
        // 只顯示該商品目前選擇的尺寸的庫存
        const sizes = Array.isArray(record.sizes) ? record.sizes : ['S'];
        const size = tableSizeMap[record.product_id] || sizes[0];
        let stockArr = [];
        if (Array.isArray(record.stock) && record.stock.length > 0) {
          stockArr = record.stock;
        } else if (record.product_stock && Array.isArray(record.product_stock)) {
          stockArr = record.product_stock;
        }
        const found = stockArr.find(s => (s.size ?? s.size_name) === size);
        return (
          <span>
            {found && typeof found.quantity === 'number' ? found.quantity : ''}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => handleEdit(record)}>編輯</button>
          <button className="btn btn-danger" onClick={() => handleDelete(record.product_id)}>刪除</button>
          <button className="btn btn-success" style={{backgroundColor: '#61b362ff'}} onClick={() => handleCopy(record)}>複製</button>
        </div>
      ),
    },
  ];

  // 選擇現有顏色時自動帶入 hex（支援 colorOptions 與 allColors）
  const handleColorSelect = (value) => {
    let selected =
      colorOptions.find(c => c.name === value) ||
      allColors.find(c => c.name === value);
    setColorName(value);
    if (selected) setColorHex(selected.hex_code);
  };

  // 監聽滑鼠移動，更新座標
  useEffect(() => {
    if (!hoveredProductId) return;
    const handleMove = (e) => {
      setHoverPos({ x: e.clientX + 16, y: e.clientY + 16 });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [hoveredProductId]);

  const fetchSeasonColors = async () => {
    const res = await axios.get('/api/season_colors');
    // season_id => [{color_id, name, hex_code}]
    const map = {};
    (Array.isArray(res.data) ? res.data : []).forEach(row => {
      if (!map[row.season_id]) map[row.season_id] = [];
      map[row.season_id].push({
        color_id: row.color_id,
        name: row.name,
        hex_code: row.hex_code
      });
    });
    setSeasonColors(map);
  };

  const handleOpenRecommendModal = async () => {
    await fetchSeasonColors();
    setRecommendModalVisible(true);
  };

  const handleAddSeasonColor = async (season_id, color_id) => {
    await axios.post('/api/season_colors', { season_id, color_id });
    await fetchSeasonColors();
  };

  const handleRemoveSeasonColor = async (season_id, color_id) => {
    await axios.delete('/api/season_colors', { data: { season_id, color_id } });
    await fetchSeasonColors();
  };

  return (
    <div className="container-fluid" style={{ background: '#f7f8fa', minHeight: '100vh', padding: 0 }}>
      {/* Toast 提示視窗 */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="row">
        {/* 左側側欄（僅示意，內容可依你的主layout調整） */}
        <div className="col-2 d-none d-md-block" style={{ background: '#F7F8FA', minHeight: '100vh', padding: '0 0', borderRight: '1px solid #e5e7eb' }}>
          {/* 頭像與名稱 */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '32px 0 16px 0', gap: 15, justifyContent: 'center' }}>
            <div style={{ width: 45, height: 45, borderRadius: '50%', background: '#F1F3F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <img src={'/icon/account_box.svg'} alt="avatar" style={{ width: 40, height: 40, opacity: 0.6 }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 20, color: '#222', marginBottom: 8 }}>Eri Weng</div>
          </div>
          {/* 搜尋框 */}
          <div style={{ padding: '0 16px', marginBottom: 24 }}>
            <div className="input-group" style={{ background: '#F1F3F6', borderRadius: 8 }}>
              <span className="input-group-text bg-transparent border-0" style={{ padding: 8, borderRadius: 'unset' }}>
                <img src={'/icon/search.svg'} alt="搜尋" width={20} height={20} style={{ opacity: 0.5 }} />
              </span>
              <input type="text" className="form-control border-0 bg-transparent" placeholder="Search for..." style={{ boxShadow: 'none', background: 'transparent', borderRadius: 'unset' }} disabled />
            </div>
          </div>
          {/* 選單列表 */}
          <div style={{ padding: '0 0' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', fontWeight: 500, color: '#222', fontSize: 16 }}>
                <img src={'/icon/home.svg'} alt="dashboard" style={{ width: 24, height: 24, marginRight: 12, opacity: 0.8 }} />
                Dashboard
              </li>
              <li style={{ background: '#F1F3F6', padding: '12px 24px', display: 'flex', alignItems: 'center', fontWeight: 500, color: '#222', fontSize: 16 }}>
                <img src={'/icon/tags.svg'} alt="商品管理" style={{ width: 24, height: 24, marginRight: 12, opacity: 0.8 }} />
                商品管理
              </li>
              <li style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', fontWeight: 500, color: '#222', fontSize: 16 }}>
                <img src={'/icon/tags.svg'} alt="會員管理" style={{ width: 24, height: 24, marginRight: 12, opacity: 0.8 }} />
                會員管理
              </li>
              <li style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', fontWeight: 500, color: '#222', fontSize: 16 }}>
                <img src={'/icon/users.svg'} alt="客服管理" style={{ width: 24, height: 24, marginRight: 12, opacity: 0.8 }} />
                客服管理
              </li>
              <li style={{ padding: '12px 24px', fontWeight: 400, color: '#222', fontSize: 16 , display: 'flex', justifyContent: 'center'}}>會員折扣碼</li>
              <li style={{ padding: '12px 24px', fontWeight: 400, color: '#222', fontSize: 16, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                客服訊息
                <span style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', background: '#D32F2F', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>9</span>
              </li>
              <li style={{ padding: '12px 24px', fontWeight: 400, color: '#222', fontSize: 16, display: 'flex', justifyContent: 'center' }}>退換貨列表</li>
              <li style={{ padding: '12px 24px', fontWeight: 400, color: '#222', fontSize: 16, display: 'flex', justifyContent: 'center' }}>訂單記錄</li>
              <li style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', fontWeight: 500, color: '#222', fontSize: 16 }}>
                <img src={'/icon/plane.svg'} alt="登出" style={{ width: 24, height: 24, marginRight: 12, opacity: 0.8 }} />
                登出
              </li>
            </ul>
          </div>
        </div>
        {/* 右側主內容 */}
        <div className="col-md-10 col-12" style={{ padding: '10px' }}>
          <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 32 }}>商品管理</h2>
          <div className="d-flex align-items-center mb-4" style={{ gap: 16 }}>
            <div className="input-group" style={{ width: 240, maxWidth: '100%' }}>
              <span className="input-group-text bg-white border-end-0 p-2" style={{ borderRadius: 'unset' }}>
                <img src={'/icon/search.svg'} alt="搜尋" width={16} height={16} style={{ display: 'block' }} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="item"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ boxShadow: 'none', borderRadius: 'unset' }}
              />
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>
              新增商品
            </button>
            <button className="btn btn-outline-secondary" onClick={handleOpenRecommendModal}>
              膚色推薦服飾
            </button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle" style={{ background: '#fff', overflow: 'hidden', width: '99%' }}>
              <thead style={{ background: '#f2f3f5' }}>
                <tr>
                  <th style={{ fontWeight: 300 }}>品項</th>
                  <th style={{ fontWeight: 300 }}>顏色</th>
                  <th style={{ fontWeight: 300 }}>尺寸</th>
                  <th style={{ fontWeight: 300 }}>價格</th>
                  <th style={{ fontWeight: 300 }}>類別</th>
                  <th style={{ fontWeight: 300 }}>庫存數</th>
                  <th style={{ fontWeight: 300 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map(item => {
                  let colorName = '';
                  let colorHex = '';
                  let colorEn = '';
                  if (Array.isArray(item.colors) && item.colors.length > 0) {
                    colorName = item.colors[0].name;
                    colorHex = item.colors[0].hex_code;
                    colorEn = item.colors[0].en_name || item.colors[0].name;
                  } else {
                    colorName = item.color_name || '';
                    colorHex = item.color_hex || '';
                    colorEn = item.color_en || '';
                  }
                  const sizes = Array.isArray(item.sizes) ? item.sizes : ['S'];
                  const selectedSize = tableSizeMap[item.product_id] || sizes[0];
                  let stockArr = Array.isArray(item.stock) ? item.stock : (item.product_stock || []);
                  const foundStock = stockArr.find(s => (s.size ?? s.size_name) === selectedSize);
                  const cat = categories.find(c => c.category_id === item.category_id);
                  return (
                    <tr key={item.product_id}>
                      <td
                        onMouseEnter={() => setHoveredProductId(item.product_id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                        style={{ position: 'relative', cursor: 'pointer' }}
                      >
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{item.product_id}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {colorHex && (
                            <span
                              style={{
                                display: 'inline-block',
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background: colorHex,
                                border: '1px solid #eee',
                                verticalAlign: 'middle'
                              }}
                            />
                          )}
                          <div>
                            {colorName}
                            <div style={{ fontSize: 12, color: '#888' }}>{colorEn}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 60, minWidth: 60 }}
                          value={selectedSize}
                          onChange={e =>
                            setTableSizeMap(prev => ({ ...prev, [item.product_id]: e.target.value }))
                          }
                        >
                          {sizes.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>{Math.round(item.price)}</td>
                      <td>{cat ? cat.name : item.category_id}</td>
                      <td>{foundStock && typeof foundStock.quantity === 'number' ? foundStock.quantity : ''}</td>
                      <td>
                        <div className="d-flex flex-row gap-2">
                          <button className="btn btn-sm btn-primary" onClick={() => handleEdit(item)}>編輯</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.product_id)}>刪除</button>
                          <button className="btn btn-sm btn-success" style={{ backgroundColor: '#61b362ff' }} onClick={() => handleCopy(item)}>複製</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* 分頁元件 */}
          <nav className="mt-4" aria-label="Page navigation">
            <ul className="pagination justify-content-center" style={{ background: 'transparent' }}>
              <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                <span className="page-link" style={{ color: currentPage === 1 ? '#888' : '#0070f3', background: 'transparent', border: 'none', fontWeight: 500 }}>
                  &lt; Previous
                </span>
              </li>
              {/* 頁碼顯示，仿照附圖，最多顯示 1 ... 5 ... N */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                // 只顯示頭尾、當前、前後2頁，其他用 ...
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
                // ... 處理
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
      </div>
      {/* Modal區塊 ...existing code... */}

      {/* Modal（Bootstrap 樣式） */}
      {modalVisible && (
        <div className="modal show" style={{ display: 'block', zIndex: 2000, background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingItem ? '編輯商品' : '新增商品'}</h5>
                <button type="button" className="btn-close" onClick={() => setModalVisible(false)}></button>
              </div>
              <div className="modal-body">
                <form>
                  {/* 圖片上傳區塊 */}
                  <div className="mb-3">
                    <label className="form-label">上傳圖片</label>
                    <input type="file" className="form-control" multiple accept="image/*" onChange={async e => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      const formData = new FormData();
                      files.forEach(f => formData.append('image', f));
                      try {
                        const res = await axios.post('/api/upload', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        // 假設回傳 { urls: [url1, url2, ...] }
                        if (res.data && Array.isArray(res.data.urls)) {
                          setImages(prev => [...prev, ...res.data.urls]);
                          setToast({ message: '圖片上傳成功', type: 'success' });
                        } else {
                          setToast({ message: '圖片上傳失敗', type: 'error' });
                        }
                      } catch (err) {
                        setToast({ message: '圖片上傳失敗', type: 'error' });
                      }
                      // 清空 input value 以便重複上傳
                      e.target.value = '';
                    }} />
                  </div>
                  {/* 圖片預覽與刪除區塊 */}
                  {images.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">已上傳圖片</label>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {images.map((img, idx) => {
                          // 修正路徑：assets/itemImage/xxx.png -> /image/itemImage/xxx.png
                          let fixedImg = img;
                          if (typeof img === 'string' && img.startsWith('/assets/itemImage/')) {
                            fixedImg = img.replace('/assets/itemImage/', '/image/itemImage/');
                          }
                          return (
                            <div key={img + idx} style={{ position: 'relative', width: 80, height: 80, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img src={fixedImg} alt={`item-img-${idx}`} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                              <button type="button" className="btn btn-danger btn-sm" style={{ position: 'absolute', top: 2, right: 2, padding: '2px 6px', fontSize: 12, borderRadius: 6, width: '30%' }} onClick={() => handleRemoveImage(idx)}>
                                &times;
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">商品名稱</label>
                <input type="text" className="form-control" value={formData.name} onChange={e => setFormData(fd => ({ ...fd, name: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">描述(短)</label>
                <input type="text" className="form-control" value={formData.description} onChange={e => setFormData(fd => ({ ...fd, description: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">描述</label>
                <textarea className="form-control" value={formData.description_long} onChange={e => setFormData(fd => ({ ...fd, description_long: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">特性 (逗號分隔多值)</label>
                <input type="text" className="form-control" placeholder="例：防水,輕量,透氣" value={formData.charactor} onChange={e => setFormData(fd => ({ ...fd, charactor: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">材質 (逗號分隔多值)</label>
                <input type="text" className="form-control" placeholder="例：棉,聚酯纖維" value={formData.material} onChange={e => setFormData(fd => ({ ...fd, material: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">尺寸圖URL</label>
                <input type="text" className="form-control" placeholder="請輸入尺寸圖檔名，例如：outer.png" value={formData.size_url} onChange={e => setFormData(fd => ({ ...fd, size_url: e.target.value }))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">價格</label>
                <input type="number" className="form-control" min={0} value={formData.price} onChange={e => setFormData(fd => ({ ...fd, price: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">分類</label>
                <select className="form-select" value={formData.category_id} onChange={e => setFormData(fd => ({ ...fd, category_id: e.target.value }))}>
                  <option value="">請選擇分類</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                  ))}
                </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">顏色名稱</label>
                    <select className="form-select mb-2" value={colorName} onChange={e => handleColorSelect(e.target.value)} style={{ width: 180, marginRight: 8 }}>
                      <option value="">請選擇顏色名稱</option>
                      {colorOptions.map(opt => (
                        <option key={opt.hex_code + opt.name} value={opt.name}>{opt.name}</option>
                      ))}
                      {allColors.filter(opt => !colorOptions.find(c => c.name === opt.name && c.hex_code === opt.hex_code)).map(opt => (
                        <option key={opt.hex_code + opt.name} value={opt.name}>{opt.name}</option>
                      ))}
                    </select>
                    <input type="text" className="form-control" placeholder="自訂顏色名稱" value={colorName} onChange={e => setColorName(e.target.value)} style={{ width: 180, marginTop: 8 }} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">顏色選擇器</label>
                    <SketchPicker color={colorHex} onChange={c => setColorHex(c.hex)} />
                    <input type="text" className="form-control" value={colorHex} onChange={e => setColorHex(e.target.value)} style={{ width: 120, marginTop: 8 }} placeholder="#RRGGBB" maxLength={7} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">尺寸</label>
                    <div>
                      {sizeOptions.map(sz => (
                        <div key={sz} className="form-check form-check-inline">
                          <input className="form-check-input" type="checkbox" id={`size-${sz}`} value={sz} checked={sizes.includes(sz)} onChange={e => {
                            if (e.target.checked) setSizes([...sizes, sz]);
                            else setSizes(sizes.filter(s => s !== sz));
                          }} />
                          <label className="form-check-label" htmlFor={`size-${sz}`}>{sz}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">庫存數量</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {sizes.map((sz, idx) => (
                        <div key={sz} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>{sz}</span>
                          <input type="number" className="form-control" min={0} style={{ width: 80 }} value={stockList.find(s => s.size === sz)?.quantity ?? 50} onChange={e => {
                            setStockList(list => list.map(s => s.size === sz ? { ...s, quantity: Number(e.target.value) } : s));
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 圖片上傳與排序區塊可依需求再補 Bootstrap 樣式 */}
                </form>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalVisible(false)}>取消</button>
                <button type="button" className="btn btn-primary" onClick={handleOk}>儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 膚色推薦服飾 Modal */}
      {recommendModalVisible && (
        <div className="modal show" style={{ display: 'block', zIndex: 2100, background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ minHeight: 500 }}>
              <div className="modal-header">
                <h5 className="modal-title">膚色推薦服飾</h5>
                <button type="button" className="btn-close" onClick={() => setRecommendModalVisible(false)}></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', gap: 32 }}>
                {/* 左側顏色表 */}
                <div style={{ flex: '0 0 260px', background: '#eaf1f7', borderRadius: 8, padding: 16 }}>
                  <table className="table table-bordered" style={{ fontSize: 14}}>
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>顏色名稱</th>
                        <th>hex</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allColors.map(c => (
                        <tr key={c.color_id}>
                          <td>{c.name}</td>
                          <td>
                            <span style={{
                              background: c.hex_code,
                              borderRadius: 4,
                              display: 'inline-block',
                              width: 24,
                              height: 24,
                              marginRight: 8,
                              border: '1px solid #ccc',
                              verticalAlign: 'middle'
                            }} />
                            {c.hex_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* 右側季節區塊 */}
                <div style={{ flex: 1, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {seasonList.map(season => (
                    <div key={season.season_id} style={{
                      background: '#eaf1f7',
                      borderRadius: 8,
                      padding: 16,
                      minWidth: 220,
                      maxWidth: 255,
                      minHeight: 300,
                      maxHeight: 300,
                      overflow: 'auto',
                      flex: '1 1 220px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch'
                    }}>
                      {/* 選擇顏色新增 select 放在最上方 */}
                      <div style={{ marginBottom: 8 }}>
                        <select className="form-select" style={{ width: '100%' }}
                          defaultValue=""
                          onChange={e => {
                            const val = Number(e.target.value);
                            if (val) handleAddSeasonColor(season.season_id, val);
                            e.target.value = '';
                          }}>
                          <option value="">選擇顏色新增</option>
                          {allColors
                            .filter(c => !(seasonColors[season.season_id] || []).find(x => x.color_id === c.color_id))
                            .map(c => (
                              <option key={c.color_id} value={c.color_id}>{c.name} {c.hex_code}</option>
                            ))}
                        </select>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 20, color: '#222', textAlign: 'center', marginBottom: 8 }}>
                        {season.name}
                      </div>
                      <div style={{ borderTop: '1px solid #b0c4de', marginBottom: 8 }}></div>
                      {/* 已推薦顏色 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(seasonColors[season.season_id] || []).map(c => (
                          <div key={c.color_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              background: c.hex_code,
                              borderRadius: 4,
                              padding: '5px',
                              width: 600,
                              textAlign: 'center',
                              border: '1px solid #ccc'
                            }}>{c.hex_code}</span>
                            <button type="button" className="btn btn-sm btn-outline-danger" style={{ marginLeft: 'auto' }}
                              onClick={() => handleRemoveSeasonColor(season.season_id, c.color_id)}>
                              移除
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRecommendModalVisible(false)}>關閉</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 懸浮圖片元件 */}
      {hoveredProductId && (() => {
        const item = pagedItems.find(i => i.product_id === hoveredProductId) || items.find(i => i.product_id === hoveredProductId);
        let img = '';
        if (item) {
          if (Array.isArray(item.images) && item.images.length > 0) {
            img = item.images[0];
            if (typeof img === 'string' && img.startsWith('/assets/itemImage/')) {
              img = img.replace('/assets/itemImage/', '/image/itemImage/');
            }
          } else if (typeof item.image === 'string') {
            img = item.image;
          }
        }
        if (!img) return null;
        return (
          <div
            style={{
              position: 'fixed',
              left: hoverPos.x,
              top: hoverPos.y,
              zIndex: 3000,
              pointerEvents: 'none',
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              padding: 4,
              width: 120,
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img src={img} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%' }} />
          </div>
        );
      })()}
    </div>
  );
};


export default ItemCreate;
