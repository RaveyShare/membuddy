/**
 * 配置测试文件
 * 用于验证新的用户中心配置是否正常工作
 * @author Ravey
 * @since 1.0.0
 */

// 导入配置模块
import { 
  getCurrentEnvConfig, 
  getUserCenterConfig, 
  getMemBuddyConfig,
  shouldUseMock,
  mockApiResponse,
  MOCK_DATA
} from '../utils/dev-config.js';

import { api } from '../utils/api.js';
import { authManager, userCenterLogin } from '../utils/auth.js';

/**
 * 测试环境配置
 */
function testEnvConfig() {
  console.log('=== 测试环境配置 ===');
  
  const envConfig = getCurrentEnvConfig();
  console.log('当前环境配置:', envConfig);
  
  const userCenterConfig = getUserCenterConfig();
  console.log('用户中心配置:', userCenterConfig);
  
  const membuddyConfig = getMemBuddyConfig();
  console.log('MemBuddy配置:', membuddyConfig);
  
  console.log('是否使用Mock:', shouldUseMock());
  console.log('');
}

/**
 * 测试Mock数据
 */
async function testMockData() {
  console.log('=== 测试Mock数据 ===');
  
  try {
    // 测试用户中心登录Mock
    const loginResponse = await mockApiResponse('/user-center/auth/wechat/mini', {}, 'POST');
    console.log('用户中心登录Mock响应:', loginResponse);
    
    // 测试记忆列表Mock
    const memoriesResponse = await mockApiResponse('/memories', {}, 'GET');
    console.log('记忆列表Mock响应:', memoriesResponse);
    
    // 测试AI生成Mock
    const aiResponse = await mockApiResponse('/ai/generate', {}, 'POST');
    console.log('AI生成Mock响应:', aiResponse);
    
  } catch (error) {
    console.error('Mock数据测试失败:', error);
  }
  console.log('');
}

/**
 * 测试API客户端
 */
async function testApiClient() {
  console.log('=== 测试API客户端 ===');
  
  try {
    // 测试用户中心API
    if (shouldUseMock()) {
      console.log('使用Mock模式测试API...');
      
      // 这里可以测试实际的API调用
      // const response = await api.userCenter.wechatLogin({
      //   code: 'test_code',
      //   userInfo: { nickname: '测试用户' }
      // });
      // console.log('用户中心登录响应:', response);
    } else {
      console.log('当前为生产模式，跳过API测试');
    }
    
  } catch (error) {
    console.error('API客户端测试失败:', error);
  }
  console.log('');
}

/**
 * 测试认证管理器
 */
function testAuthManager() {
  console.log('=== 测试认证管理器 ===');
  
  try {
    // 测试初始状态
    console.log('初始认证状态:', authManager.isAuthenticated());
    console.log('初始用户信息:', authManager.getCurrentUser());
    console.log('初始Token:', authManager.getToken());
    console.log('初始AccessToken:', authManager.getAccessToken());
    
    // 测试设置认证数据
    const mockAuthData = {
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
      tokenType: 'Bearer',
      expiresIn: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: 'test_user_001',
        nickname: '测试用户',
        avatar: 'https://via.placeholder.com/100x100?text=Test'
      }
    };
    
    authManager.setAuth(mockAuthData);
    console.log('设置认证数据后:');
    console.log('认证状态:', authManager.isAuthenticated());
    console.log('用户信息:', authManager.getCurrentUser());
    console.log('Token:', authManager.getToken());
    console.log('AccessToken:', authManager.getAccessToken());
    console.log('TokenType:', authManager.getTokenType());
    console.log('Token是否过期:', authManager.isTokenExpired());
    
    // 清除认证数据
    authManager.clearAuth();
    console.log('清除认证数据后:');
    console.log('认证状态:', authManager.isAuthenticated());
    
  } catch (error) {
    console.error('认证管理器测试失败:', error);
  }
  console.log('');
}

/**
 * 测试兼容性
 */
function testCompatibility() {
  console.log('=== 测试兼容性 ===');
  
  try {
    // 测试旧版本认证数据格式
    const oldAuthData = {
      token: 'old_token_format',
      refreshToken: 'old_refresh_token',
      user: {
        id: 'old_user_001',
        nickname: '旧版本用户'
      }
    };
    
    authManager.setAuth(oldAuthData);
    console.log('设置旧版本认证数据后:');
    console.log('认证状态:', authManager.isAuthenticated());
    console.log('Token:', authManager.getToken());
    console.log('AccessToken:', authManager.getAccessToken());
    
    // 清除数据
    authManager.clearAuth();
    
  } catch (error) {
    console.error('兼容性测试失败:', error);
  }
  console.log('');
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('开始运行配置测试...\n');
  
  testEnvConfig();
  testMockData();
  testApiClient();
  testAuthManager();
  testCompatibility();
  
  console.log('所有测试完成！');
}

// 导出测试函数
export {
  testEnvConfig,
  testMockData,
  testApiClient,
  testAuthManager,
  testCompatibility,
  runAllTests
};

// 如果直接运行此文件，执行所有测试
if (typeof wx !== 'undefined') {
  // 在小程序环境中，可以在控制台调用 runAllTests()
  console.log('配置测试模块已加载，请在控制台调用 runAllTests() 执行测试');
} else {
  // 在Node.js环境中直接运行
  runAllTests();
}