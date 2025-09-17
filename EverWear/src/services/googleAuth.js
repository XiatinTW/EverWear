// Google Identity Services (GIS) - 新版 Google OAuth 服務
import { jwtDecode } from 'jwt-decode';

class GoogleAuthService {
  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';
    this.initialized = false;
    this.initPromise = null;
  }

  // 初始化 Google Identity Services
  async initialize() {
    if (this.initialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // 檢查是否已載入 Google Identity Services
      if (!window.google?.accounts?.oauth2) {
        console.warn('Google Identity Services 尚未載入');
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      try {
        // 直接標記為已初始化，因為我們主要使用 OAuth 2.0
        this.initialized = true;
        // console.log('Google Identity Services 初始化成功');
        resolve();
      } catch (error) {
        console.error('Google Identity Services 初始化失敗:', error);
        reject(error);
      }
    });

    return this.initPromise;
  }

  // 處理 Google 回傳的憑證響應
  handleCredentialResponse(response) {
    if (this.credentialCallback) {
      this.credentialCallback(response);
    }
  }

  // Google 登入 - 直接使用 OAuth 2.0 彈出視窗方式
  async signIn() {
    try {
      await this.initialize();

      // 直接使用 OAuth 2.0 彈出視窗，避免 FedCM 問題
      return await this.signInWithPopup();
    } catch (error) {
      console.error('Google 登入失敗:', error);
      throw error;
    }
  }

  // 備用的彈出視窗登入方式
  async showPopupLogin() {
    return new Promise((resolve, reject) => {
      // 重新初始化以使用彈出視窗
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => {
          try {
            if (response.credential) {
              const userInfo = jwtDecode(response.credential);
              
              const googleUser = {
                id: userInfo.sub,
                email: userInfo.email,
                firstName: userInfo.given_name || '',
                lastName: userInfo.family_name || '',
                name: userInfo.name || '',
                imageUrl: userInfo.picture || '',
                idToken: response.credential
              };

              resolve(googleUser);
            } else {
              reject(new Error('無法獲取用戶憑證'));
            }
          } catch (error) {
            reject(error);
          }
        },
        auto_select: false
      });

      // 顯示彈出視窗
      window.google.accounts.id.prompt();
    });
  }

  // 使用 OAuth 2.0 彈出視窗 (主要登入方式)
  async signInWithPopup() {
    try {
      await this.initialize();

      return new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'profile email',
          callback: async (response) => {
            try {
              if (response.access_token) {
                // 使用 access token 獲取用戶資訊
                const userInfo = await this.fetchUserInfo(response.access_token);
                resolve(userInfo);
              } else if (response.error) {
                // 處理各種錯誤情況
                if (response.error === 'popup_closed_by_user') {
                  reject(new Error('用戶取消了登入'));
                } else {
                  reject(new Error(`Google OAuth 錯誤: ${response.error}`));
                }
              } else {
                reject(new Error('無法獲取 access token'));
              }
            } catch (error) {
              reject(error);
            }
          },
          error_callback: (error) => {
            console.error('Google OAuth 2.0 錯誤:', error);
            reject(new Error(`Google OAuth 錯誤: ${error.type || 'unknown'}`));
          }
        });

        // 請求 access token (會顯示彈出視窗)
        client.requestAccessToken();
      });
    } catch (error) {
      console.error('Google OAuth 2.0 登入失敗:', error);
      throw error;
    }
  }

  // 使用 access token 獲取用戶資訊
  async fetchUserInfo(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      const userInfo = await response.json();

      return {
        id: userInfo.id,
        email: userInfo.email,
        first_name: userInfo.given_name || '',
        last_name: userInfo.family_name || '',
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        name: userInfo.name || '',
        imageUrl: userInfo.picture || '',
        accessToken: accessToken
      };
    } catch (error) {
      console.error('獲取用戶資訊失敗:', error);
      throw error;
    }
  }

  // Google 登出
  async signOut() {
    try {
      if (this.initialized && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (error) {
      console.error('Google 登出失敗:', error);
    }
  }

  // 檢查是否已登入 (GIS 不提供持續登入狀態檢查)
  isSignedIn() {
    return false; // GIS 不維持登入狀態
  }

  // 獲取當前用戶 (GIS 不提供持續登入狀態)
  getCurrentUser() {
    return null; // GIS 不維持登入狀態
  }
}

export const googleAuthService = new GoogleAuthService();
