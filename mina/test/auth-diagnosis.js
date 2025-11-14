/**
 * 认证诊断脚本（开发者工具 Console 使用）
 * 提供快速检查本地存储、认证状态、过期判断、监听器等工具函数
 * 使用方式：
 *   1) 在开发者工具 Console 执行：AuthDiag.run()
 *   2) 如需开始监听：const stop = AuthDiag.startListener(); // 需要时调用 stop()
 *   3) 查看存储：AuthDiag.printStorage()
 *   4) 清理认证：AuthDiag.clearAuth()
 * @author Ravey
 * @since 1.0.0
 */

const STORAGE_KEYS = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user_data',
  ACCESS_TOKEN_KEY: 'access_token',
  TOKEN_TYPE_KEY: 'token_type',
  EXPIRES_IN_KEY: 'expires_in'
};

function getAuthModule() {
  try {
    // 从测试目录到 utils 的相对路径
    return require('../utils/auth.js');
  } catch (e) {
    console.error('加载认证模块失败:', e);
    return null;
  }
}

function readStorage() {
  const data = {};
  try {
    Object.keys(STORAGE_KEYS).forEach((k) => {
      const key = STORAGE_KEYS[k];
      data[key] = wx.getStorageSync(key);
    });
  } catch (e) {
    console.error('读取存储失败:', e);
  }
  return data;
}

function printStorage() {
  const s = readStorage();
  const nowSec = Math.floor(Date.now() / 1000);
  console.log('—— 存储数据 ——');
  console.log({
    access_token: s['access_token'],
    expires_in: s['expires_in'],
    user_data: s['user_data'],
    auth_token: s['auth_token'],
    refresh_token: s['refresh_token'],
    token_type: s['token_type'],
    now_sec: nowSec,
    expires_in_valid: typeof s['expires_in'] === 'number' ? s['expires_in'] > nowSec : Number(s['expires_in']) > nowSec
  });
}

function printAuthState() {
  const auth = getAuthModule();
  if (!auth) return;
  const { authManager, isAuthenticated, getCurrentUser, getToken, getAccessToken } = auth;
  const nowSec = Math.floor(Date.now() / 1000);
  const state = {
    isAuthenticated: isAuthenticated(),
    isTokenExpired: !!authManager && authManager.isTokenExpired(),
    hasUser: !!getCurrentUser(),
    user: getCurrentUser(),
    token: getToken(),
    accessToken: getAccessToken(),
    expiresIn: authManager ? authManager.expiresIn : null,
    nowSec
  };
  console.log('—— 认证状态 ——');
  console.log(state);
}

function startListener() {
  const auth = getAuthModule();
  if (!auth) return () => {};
  console.log('开始监听认证状态变化');
  const cancel = auth.addAuthListener(() => {
    console.log('[监听] 认证状态变化');
    printAuthState();
  });
  return cancel;
}

function clearAuth() {
  const auth = getAuthModule();
  if (!auth) return;
  console.log('清除认证数据');
  auth.clearAuth();
}

function run() {
  console.log('=== Auth 诊断开始 ===');
  printStorage();
  printAuthState();
  console.log('=== Auth 诊断结束 ===');
}

// 暴露到全局，便于控制台调用
try {
  globalThis.AuthDiag = { run, printStorage, printAuthState, startListener, clearAuth };
  console.log('AuthDiag 已准备好：在 Console 执行 AuthDiag.run()');
} catch (_) {}

export default { run, printStorage, printAuthState, startListener, clearAuth };