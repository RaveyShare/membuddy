/**
 * 登录功能测试
 * @author Ravey
 * @since 1.0.0
 */

import { 
  userCenterLogin, 
  wxLogin, 
  getUserProfile,
  authManager 
} from '../utils/auth.js';
import { getCurrentEnvConfig } from '../utils/dev-config.js';

/**
 * 测试微信登录code获取
 */
async function testWxLogin() {
  console.log('=== 测试微信登录code获取 ===');
  
  try {
    const code = await wxLogin();
    console.log('获取微信登录code成功:', code);
    return code;
  } catch (error) {
    console.error('获取微信登录code失败:', error);
    return null;
  }
}

/**
 * 测试用户信息获取
 */
async function testGetUserProfile() {
  console.log('=== 测试用户信息获取 ===');
  
  try {
    const userInfo = await getUserProfile();
    console.log('获取用户信息成功:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

/**
 * 测试用户中心登录
 */
async function testUserCenterLogin() {
  console.log('=== 测试用户中心登录 ===');
  
  try {
    // 获取微信登录code
    const code = await testWxLogin();
    if (!code) {
      console.log('无法获取微信登录code，跳过登录测试');
      return;
    }
    
    // 获取用户信息（可选）
    const userInfo = await testGetUserProfile();
    
    // 执行用户中心登录
    const loginResult = await userCenterLogin(code, userInfo);
    console.log('用户中心登录成功:', loginResult);
    
    // 验证认证状态
    console.log('登录后认证状态:', authManager.isAuthenticated());
    console.log('登录后用户信息:', authManager.getCurrentUser());
    console.log('登录后Token:', authManager.getToken());
    
    return loginResult;
    
  } catch (error) {
    console.error('用户中心登录测试失败:', error);
    return null;
  }
}

/**
 * 测试token刷新
 */
async function testTokenRefresh() {
  console.log('=== 测试token刷新 ===');
  
  try {
    if (!authManager.isAuthenticated()) {
      console.log('用户未登录，跳过token刷新测试');
      return;
    }
    
    const refreshResult = await authManager.refreshUserCenterToken();
    console.log('token刷新成功:', refreshResult);
    
    return refreshResult;
    
  } catch (error) {
    console.error('token刷新测试失败:', error);
    return null;
  }
}

/**
 * 测试登出
 */
function testLogout() {
  console.log('=== 测试登出 ===');
  
  try {
    console.log('登出前认证状态:', authManager.isAuthenticated());
    
    authManager.clearAuth();
    
    console.log('登出后认证状态:', authManager.isAuthenticated());
    console.log('登出后用户信息:', authManager.getCurrentUser());
    console.log('登出后Token:', authManager.getToken());
    
  } catch (error) {
    console.error('登出测试失败:', error);
  }
}

/**
 * 完整的登录流程测试
 */
async function testCompleteLoginFlow() {
  console.log('=== 完整登录流程测试 ===');
  
  const envConfig = getCurrentEnvConfig();
  console.log('当前环境配置:', envConfig);
  
  try {
    // 1. 测试登录
    const loginResult = await testUserCenterLogin();
    if (!loginResult) {
      console.log('登录失败，终止测试');
      return;
    }
    
    // 2. 等待一段时间
    console.log('等待2秒...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. 测试token刷新
    await testTokenRefresh();
    
    // 4. 等待一段时间
    console.log('等待2秒...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. 测试登出
    testLogout();
    
    console.log('完整登录流程测试完成');
    
  } catch (error) {
    console.error('完整登录流程测试失败:', error);
  }
}

/**
 * Mock模式下的登录测试
 */
async function testMockLogin() {
  console.log('=== Mock模式登录测试 ===');
  
  try {
    // 模拟微信登录code
    const mockCode = 'mock_wx_code_' + Date.now();
    
    // 模拟用户信息
    const mockUserInfo = {
      nickname: 'Mock测试用户',
      avatarUrl: 'https://via.placeholder.com/100x100?text=Mock',
      gender: 1,
      country: '中国',
      province: '广东',
      city: '深圳'
    };
    
    console.log('使用Mock数据进行登录测试...');
    console.log('Mock Code:', mockCode);
    console.log('Mock UserInfo:', mockUserInfo);
    
    // 执行登录
    const loginResult = await userCenterLogin(mockCode, mockUserInfo);
    console.log('Mock登录成功:', loginResult);
    
    // 验证认证状态
    console.log('Mock登录后认证状态:', authManager.isAuthenticated());
    console.log('Mock登录后用户信息:', authManager.getCurrentUser());
    
    return loginResult;
    
  } catch (error) {
    console.error('Mock登录测试失败:', error);
    return null;
  }
}

// 导出测试函数
export {
  testWxLogin,
  testGetUserProfile,
  testUserCenterLogin,
  testTokenRefresh,
  testLogout,
  testCompleteLoginFlow,
  testMockLogin
};

// 在小程序环境中提供全局测试函数
if (typeof wx !== 'undefined') {
  // 将测试函数挂载到全局，方便在控制台调用
  wx.testLogin = {
    testWxLogin,
    testGetUserProfile,
    testUserCenterLogin,
    testTokenRefresh,
    testLogout,
    testCompleteLoginFlow,
    testMockLogin
  };
  
  console.log('登录测试模块已加载，可在控制台使用 wx.testLogin 调用测试函数');
}