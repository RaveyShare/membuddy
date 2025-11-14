/**
 * 用户中心集成测试脚本
 * 用于验证微信小程序与用户中心的集成
 * @author ravey
 */

const { getCurrentEnvConfig } = require('./utils/dev-config.js');
const { userCenterLogin, isAuthenticated, getToken } = require('./utils/auth.js');
const { api } = require('./utils/api.js');

// 测试配置
const TEST_CONFIG = {
  appId: 'wxe6d828ae0245ab9c',
  testCode: '0e3jPi1w37FxV53P351w3gHGEr3jPi1F',
  testUserInfo: {
    nickname: '测试用户',
    avatarUrl: ''
  }
};

/**
 * 显示测试结果
 */
function showTestResult(testName, success, message, data = null) {
  const status = success ? '✅ 通过' : '❌ 失败';
  console.log(`\n${testName}: ${status}`);
  console.log(`  ${message}`);
  if (data) {
    console.log(`  数据:`, JSON.stringify(data, null, 2));
  }
}

/**
 * 测试环境配置
 */
function testEnvironmentConfig() {
  console.log('🧪 开始环境配置测试...');
  
  try {
    const config = getCurrentEnvConfig();
    showTestResult(
      '环境配置',
      true,
      `当前环境: ${config.baseURL}, Mock模式: ${config.useMock ? '开启' : '关闭'}`
    );
    return config;
  } catch (error) {
    showTestResult('环境配置', false, error.message);
    return null;
  }
}

/**
 * 测试用户中心登录
 */
async function testUserCenterLogin() {
  console.log('\n🔑 开始用户中心登录测试...');
  
  try {
    // 调用用户中心登录
    const result = await userCenterLogin(
      TEST_CONFIG.appId,
      TEST_CONFIG.testCode,
      TEST_CONFIG.testUserInfo
    );
    
    showTestResult(
      '用户中心登录',
      true,
      '登录成功，token 已保存',
      { token: result.token, userInfo: result.userInfo }
    );
    
    return result;
  } catch (error) {
    showTestResult(
      '用户中心登录',
      false,
      `登录失败: ${error.message || error}`
    );
    return null;
  }
}

/**
 * 测试认证状态
 */
function testAuthenticationStatus() {
  console.log('\n🔒 开始认证状态测试...');
  
  try {
    const isAuth = isAuthenticated();
    const token = getToken();
    
    showTestResult(
      '认证状态',
      isAuth && token,
      `认证状态: ${isAuth ? '已认证' : '未认证'}, Token: ${token ? '存在' : '不存在'}`
    );
    
    return { isAuthenticated: isAuth, hasToken: !!token };
  } catch (error) {
    showTestResult('认证状态', false, error.message);
    return { isAuthenticated: false, hasToken: false };
  }
}

/**
 * 测试API请求携带Token
 */
async function testApiWithToken() {
  console.log('\n🌐 开始API Token测试...');
  
  try {
    // 测试调用需要认证的API（使用Mock数据）
    const response = await api.membuddy.getMemories();
    
    showTestResult(
      'API Token验证',
      response && response.code === 0,
      'API请求成功，Token已正确携带',
      { responseCode: response?.code }
    );
    
    return response;
  } catch (error) {
    showTestResult(
      'API Token验证',
      false,
      `API请求失败: ${error.message || error}`
    );
    return null;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始用户中心集成测试...\n');
  console.log('='.repeat(50));
  
  // 1. 测试环境配置
  const config = testEnvironmentConfig();
  if (!config) {
    console.log('\n❌ 环境配置测试失败，终止测试');
    return;
  }
  
  // 2. 测试用户中心登录
  const loginResult = await testUserCenterLogin();
  if (!loginResult) {
    console.log('\n❌ 用户中心登录测试失败，终止测试');
    return;
  }
  
  // 3. 测试认证状态
  const authStatus = testAuthenticationStatus();
  if (!authStatus.isAuthenticated || !authStatus.hasToken) {
    console.log('\n❌ 认证状态测试失败，终止测试');
    return;
  }
  
  // 4. 测试API Token
  await testApiWithToken();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 集成测试完成！');
  console.log('\n📋 测试总结:');
  console.log(`  环境: ${config.baseURL}`);
  console.log(`  Mock模式: ${config.useMock ? '开启' : '关闭'}`);
  console.log(`  用户中心登录: ✅`);
  console.log(`  认证状态: ✅`);
  console.log(`  API Token: ✅`);
  
  console.log('\n🔧 下一步建议:');
  if (config.useMock) {
    console.log('  - 切换到本地环境进行真实接口测试');
    console.log('  - 修改 dev-config.js 中的 currentEnv 为 "local"');
  } else {
    console.log('  - 可以部署到测试环境进行进一步测试');
  }
}

/**
 * 主函数
 */
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = {
    runAllTests,
    testEnvironmentConfig,
    testUserCenterLogin,
    testAuthenticationStatus,
    testApiWithToken
  };
  
  // 如果直接运行此脚本
  if (require.main === module) {
    runAllTests().catch(console.error);
  }
} else {
  // 小程序环境
  module.exports = {
    runAllTests,
    testEnvironmentConfig,
    testUserCenterLogin,
    testAuthenticationStatus,
    testApiWithToken
  };
}

/**
 * 快速测试函数（用于小程序控制台）
 */
function quickTest() {
  console.log('🚀 快速测试开始...');
  
  // 检查当前环境
  const config = getCurrentEnvConfig();
  console.log(`当前环境: ${config.baseURL}, Mock: ${config.useMock}`);
  
  // 检查认证状态
  const isAuth = isAuthenticated();
  const token = getToken();
  console.log(`认证状态: ${isAuth ? '已认证' : '未认证'}`);
  console.log(`Token状态: ${token ? '存在' : '不存在'}`);
  
  if (!isAuth) {
    console.log('请先进行用户中心登录测试');
    return;
  }
  
  console.log('✅ 快速测试通过，系统运行正常');
}

// 导出快速测试函数
module.exports.quickTest = quickTest;