import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import '../../style/Contacts.css';
import { contactAPI } from '../../services/api';

// 子組件：聊天列表
function ContactsList() {
  const navigate = useNavigate();
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入聯絡紀錄
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const response = await contactAPI.getThreads();
        // API回應格式: { success: true, data: { threads: [...] } }
        if (response.success) {
          setChatList(response.data.threads || response.data);
        } else {
          throw new Error(response.message || '載入聯絡紀錄失敗');
        }
      } catch (err) {
        setError(err.message || '載入聯絡紀錄失敗');
        console.error('載入聯絡紀錄錯誤:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  const handleChatClick = (chatId) => {
    navigate(`chat/${chatId}`);
  };

  // 判斷訊息狀態
  const getMessageState = (chat) => {
    if (chat.hasUnread) return 'unread';  // 未讀：正常色 + 紅點
    if (chat.isRead) return 'read';       // 已讀：暗色
    return 'normal';
  };

  return (
    <div>
      <h1 className="contacts-title">聯絡記錄</h1>
      
      <div className="contacts-list-main">
        <div className="contacts-list-container">
          {/* 聊天列表 - 可捲動區域 */}
          <div className="contacts-list">
            {loading ? (
              <p>載入中...</p>
            ) : error ? (
              <p>{error}</p>
            ) : chatList.length === 0 ? (
              <div className="no-contacts">
                <h3>尚未有聯絡記錄</h3>
                <p>如有任何問題，歡迎聯絡我們的客服團隊</p>
                
              </div>
            ) : (
              chatList.map(chat => {
                const messageState = getMessageState(chat);
                return (
                  <div 
                    key={chat.id || chat.contactId}
                    onClick={() => handleChatClick(chat.id || chat.contactId)}
                    className={`chat-item ${messageState === 'read' ? 'read' : 'unread'}`}
                  >
                    <div className="chat-item-content">
                      <div className="chat-info">
                        <span className="chat-number">訊息編號：#{chat.id || chat.contactId}</span>
                        <span className="chat-subject">主旨：{chat.subject}</span>
                      </div>
                      {chat.hasUnread && (
                        <div className="unread-dot"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* 按鈕區域 - 在主容器內底部 */}
          <div className="contacts-bottom-btn-area">
            <button 
              onClick={() => navigate('compose')}
              className="contacts-btn-primary"
            >
              新增訊息
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 子組件：對話頁面
function ContactsChat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // 從URL參數獲取chatId
  const chatId = location.pathname.split('/').pop();
  
  // 時間格式化函數
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // 今天的訊息顯示時間
      return date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      // 昨天以前的訊息顯示日期和時間
      return date.toLocaleString('zh-TW', { 
        month: '2-digit',
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };
  
  // 載入對話內容
  useEffect(() => {
    const loadChatData = async () => {
      try {
        setLoading(true);
        const response = await contactAPI.getThreadMessages(chatId);
        // API回應格式: { success: true, data: { thread, messages } }
        if (response.success) {
          const contact = response.data;
          setContactInfo(contact.thread || contact);
          setMessages(contact.messages || []);
          
          // 標記為已讀 (暫時註解，後續可以添加此功能)
          // if (contact.hasUnread) {
          //   await contactAPI.markAsRead(chatId);
          // }
        } else {
          // 如果找不到對話，返回列表
          navigate('/account/contacts');
        }
      } catch (error) {
        console.error('載入對話失敗:', error);
        alert('載入對話失敗');
        navigate('/account/contacts');
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      loadChatData();
    }
  }, [chatId, navigate]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      
      // 發送訊息到 API
      await contactAPI.replyToThread(chatId, newMessage.trim());
      
      // 創建新訊息並立即顯示
      const message = {
        id: `msg_${chatId}_${Date.now()}_user`,
        sender: "user", 
        content: newMessage.trim(),
        sentAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      
    } catch (error) {
      console.error('發送訊息失敗:', error);
      alert('發送訊息失敗，請稍後再試');
    } finally {
      setSending(false);
    }
  };
  // 自動滾動到最新訊息
  useEffect(() => {
    const container = document.querySelector('.chat-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <div>
        <h1 className="contacts-title">訊息內容</h1>
        <div style={{ padding: '20px', textAlign: 'center' }}>載入中...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="contacts-title">訊息內容</h1>

      <div className="chat-container">
        {/* 聊天標題區 - 固定在上方 */}
        <div className="chat-header">
          <div className="chat-info">
            <span className="chat-number">訊息編號：#{chatId}</span>
            <span className="chat-subject">主旨：{contactInfo?.subject || '對話'}</span>
          </div>
        </div>

        {/* 訊息區域 - 可捲動 */}
        <div className="chat-messages-container">
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={message.id || `msg-${index}-${message.sentAt}`} className={`message ${message.sender === 'user' ? 'message-user' : message.sender === 'admin' ? 'message-admin' : 'message-support'}`}>
                <div className={`message-bubble ${message.sender === 'admin' ? 'admin' : message.sender}`}>
                  {message.content}
                </div>
                <div className="message-time">
                  {formatTime(message.sentAt)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 輸入區域 - 固定在底部 */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={sending ? "發送中..." : "輸入訊息（Ctrl+Enter 發送）"}
              className="chat-input"
              disabled={sending}
              rows="2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button 
              onClick={handleSendMessage}
              className="chat-send-btn"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? '發送中...' : '發送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 子組件：撰寫新訊息
function ContactsCompose() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.content.trim()) return;
    
    try {
      setLoading(true);
      
      // 使用真實 API 創建新訊息
      const response = await contactAPI.createThread({
        subject: formData.subject.trim(),
        content: formData.content.trim()
      });
      
      // API回應格式: { success: true, data: { threadId, subject, status } }
      if (response.success) {
        console.log('發送新訊息成功:', response.data);
        setShowSuccessModal(true);
        
        // 清空表單
        setFormData({
          subject: '',
          content: ''
        });
      } else {
        throw new Error(response.message || '發送訊息失敗');
      }
      
    } catch (error) {
      console.error('發送訊息失敗:', error);
      alert(error.message || '發送訊息失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/account/contacts');
  };

  return (
    <div>
      <h1 className="compose-title">新增新訊息</h1>

      <div className="compose-main">
        <div className="compose-container">
          <form onSubmit={handleSubmit} className="compose-form">
            <div className="compose-form-group">
              <label>主旨：</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>

            <div className="compose-form-group">
              <label>詳細內容：</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows="12"
                required
              />
            </div>
          </form>
        </div>
        
        <div className="compose-bottom-btn-area">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!formData.subject.trim() || !formData.content.trim() || loading}
            className="compose-submit-btn"
          >
            {loading ? '發送中...' : '發送'}
          </button>
        </div>
      </div>

      {/* 成功Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={handleSuccessClose}
              className="modal-close"
            >
              ×
            </button>
            <div className="modal-body">
              <h3>訊息已發送</h3>
              <p>您的訊息已成功建立，客服人員會在24小時內回覆您。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 主組件：路由容器
export default function Contacts() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<ContactsList />} />
        <Route path="/chat/:chatId" element={<ContactsChat />} />
        <Route path="/compose" element={<ContactsCompose />} />
        <Route path="*" element={<Navigate to="/home/account/contacts" replace />} />
      </Routes>
    </div>
  );
}
