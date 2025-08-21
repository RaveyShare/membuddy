/**
 * 微信小程序存储工具
 * 提供统一的本地存储接口
 */

/**
 * 存储工具类
 */
class StorageManager {
  constructor() {
    this.prefix = 'membuddy_'; // 存储键前缀
  }

  // 生成带前缀的键名
  getKey(key) {
    return `${this.prefix}${key}`;
  }

  // 同步设置存储
  setSync(key, data) {
    try {
      const fullKey = this.getKey(key);
      wx.setStorageSync(fullKey, data);
      return true;
    } catch (error) {
      console.error('存储数据失败:', error);
      return false;
    }
  }

  // 异步设置存储
  set(key, data) {
    return new Promise((resolve, reject) => {
      const fullKey = this.getKey(key);
      wx.setStorage({
        key: fullKey,
        data,
        success: () => resolve(true),
        fail: (error) => {
          console.error('存储数据失败:', error);
          reject(error);
        }
      });
    });
  }

  // 同步获取存储
  getSync(key, defaultValue = null) {
    try {
      const fullKey = this.getKey(key);
      const data = wx.getStorageSync(fullKey);
      return data !== '' ? data : defaultValue;
    } catch (error) {
      console.error('获取存储数据失败:', error);
      return defaultValue;
    }
  }

  // 异步获取存储
  get(key, defaultValue = null) {
    return new Promise((resolve) => {
      const fullKey = this.getKey(key);
      wx.getStorage({
        key: fullKey,
        success: (res) => resolve(res.data),
        fail: () => resolve(defaultValue)
      });
    });
  }

  // 同步删除存储
  removeSync(key) {
    try {
      const fullKey = this.getKey(key);
      wx.removeStorageSync(fullKey);
      return true;
    } catch (error) {
      console.error('删除存储数据失败:', error);
      return false;
    }
  }

  // 异步删除存储
  remove(key) {
    return new Promise((resolve, reject) => {
      const fullKey = this.getKey(key);
      wx.removeStorage({
        key: fullKey,
        success: () => resolve(true),
        fail: (error) => {
          console.error('删除存储数据失败:', error);
          reject(error);
        }
      });
    });
  }

  // 清除所有存储
  clearAll() {
    return new Promise((resolve, reject) => {
      wx.clearStorage({
        success: () => resolve(true),
        fail: (error) => {
          console.error('清除存储失败:', error);
          reject(error);
        }
      });
    });
  }

  // 获取存储信息
  getInfo() {
    return new Promise((resolve, reject) => {
      wx.getStorageInfo({
        success: (res) => resolve(res),
        fail: (error) => {
          console.error('获取存储信息失败:', error);
          reject(error);
        }
      });
    });
  }

  // 检查键是否存在
  hasKey(key) {
    try {
      const fullKey = this.getKey(key);
      const data = wx.getStorageSync(fullKey);
      return data !== '';
    } catch (error) {
      return false;
    }
  }

  // 获取所有带前缀的键
  async getAllKeys() {
    try {
      const info = await this.getInfo();
      return info.keys.filter(key => key.startsWith(this.prefix));
    } catch (error) {
      console.error('获取所有键失败:', error);
      return [];
    }
  }

  // 批量设置
  setBatch(data) {
    const promises = Object.entries(data).map(([key, value]) => 
      this.set(key, value).catch(error => ({ key, error }))
    );
    return Promise.all(promises);
  }

  // 批量获取
  async getBatch(keys, defaultValue = null) {
    const promises = keys.map(async (key) => {
      try {
        const value = await this.get(key, defaultValue);
        return { key, value, success: true };
      } catch (error) {
        return { key, value: defaultValue, success: false, error };
      }
    });
    return Promise.all(promises);
  }

  // 批量删除
  removeBatch(keys) {
    const promises = keys.map(key => 
      this.remove(key).catch(error => ({ key, error }))
    );
    return Promise.all(promises);
  }
}

// 创建存储管理器实例
const storage = new StorageManager();

// 导出存储管理器
export default storage;

// 导出便捷方法
export const {
  setSync,
  set,
  getSync,
  get,
  removeSync,
  remove,
  clearAll,
  getInfo,
  hasKey,
  getAllKeys,
  setBatch,
  getBatch,
  removeBatch
} = storage;

// 特定数据类型的存储工具
export const userStorage = {
  // 用户设置
  setSettings: (settings) => storage.set('user_settings', settings),
  getSettings: (defaultSettings = {}) => storage.get('user_settings', defaultSettings),
  
  // 用户偏好
  setPreferences: (preferences) => storage.set('user_preferences', preferences),
  getPreferences: (defaultPreferences = {}) => storage.get('user_preferences', defaultPreferences),
  
  // 最近搜索
  setRecentSearches: (searches) => storage.set('recent_searches', searches),
  getRecentSearches: () => storage.get('recent_searches', []),
  addRecentSearch: async (query) => {
    const searches = await userStorage.getRecentSearches();
    const filtered = searches.filter(s => s !== query);
    const updated = [query, ...filtered].slice(0, 10); // 保留最近10条
    return userStorage.setRecentSearches(updated);
  },
  
  // 草稿数据
  setDraft: (key, data) => storage.set(`draft_${key}`, data),
  getDraft: (key) => storage.get(`draft_${key}`, null),
  removeDraft: (key) => storage.remove(`draft_${key}`),
  
  // 缓存数据
  setCache: (key, data, expireTime = 24 * 60 * 60 * 1000) => {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expireTime
    };
    return storage.set(`cache_${key}`, cacheData);
  },
  
  getCache: async (key) => {
    const cacheData = await storage.get(`cache_${key}`, null);
    if (!cacheData) return null;
    
    const { data, timestamp, expireTime } = cacheData;
    const now = Date.now();
    
    // 检查是否过期
    if (now - timestamp > expireTime) {
      await storage.remove(`cache_${key}`);
      return null;
    }
    
    return data;
  },
  
  removeCache: (key) => storage.remove(`cache_${key}`),
  
  // 清除过期缓存
  clearExpiredCache: async () => {
    try {
      const keys = await storage.getAllKeys();
      const cacheKeys = keys.filter(key => key.includes('cache_'));
      
      for (const fullKey of cacheKeys) {
        const key = fullKey.replace(storage.prefix, '').replace('cache_', '');
        await userStorage.getCache(key); // 这会自动清除过期的缓存
      }
    } catch (error) {
      console.error('清除过期缓存失败:', error);
    }
  }
};

// 应用配置存储
export const appStorage = {
  // 应用版本
  setVersion: (version) => storage.set('app_version', version),
  getVersion: () => storage.get('app_version', '1.0.0'),
  
  // 首次启动标记
  setFirstLaunch: (isFirst) => storage.set('first_launch', isFirst),
  isFirstLaunch: async () => {
    const isFirst = await storage.get('first_launch', true);
    if (isFirst) {
      await appStorage.setFirstLaunch(false);
    }
    return isFirst;
  },
  
  // 应用配置
  setConfig: (config) => storage.set('app_config', config),
  getConfig: (defaultConfig = {}) => storage.get('app_config', defaultConfig),
  
  // 错误日志
  addErrorLog: async (error) => {
    const logs = await storage.get('error_logs', []);
    const newLog = {
      timestamp: Date.now(),
      error: error.toString(),
      stack: error.stack,
      page: getCurrentPages().pop()?.route || 'unknown'
    };
    
    logs.unshift(newLog);
    // 只保留最近50条错误日志
    const trimmedLogs = logs.slice(0, 50);
    
    return storage.set('error_logs', trimmedLogs);
  },
  
  getErrorLogs: () => storage.get('error_logs', []),
  clearErrorLogs: () => storage.remove('error_logs')
};