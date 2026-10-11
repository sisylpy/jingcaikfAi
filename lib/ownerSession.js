// Picker 员工会话凭证。
// 复用后端已签发的 ownerAuth（企业微信 js_code 换 open_userid 后由服务端签发，
// 绑定员工 ID、配送商 ID、角色、有效期与撤销状态），不另造登录体系。
// 这里只负责保存并在后续请求上自动携带，让后端能够识别真实调用者。

const TOKEN_KEY = 'ownerAccessToken'
const EXPIRES_KEY = 'ownerTokenExpiresAt'
const WEIGHER_TOKEN_KEY = 'weigherAccessToken'
const WEIGHER_EXPIRES_KEY = 'weigherTokenExpiresAt'

var apiUrl = require('../config.js').default || require('../config.js')

// 登录与注册入口在拿到会话前必须可无凭证访问。
const PUBLIC_PATHS = [
  '/api/nxdistributeruser/disLogin',
  '/api/nxdistributeruser/wxworkLogin',
  '/api/nxdistributeruser/weighterLoginKf',
  '/api/nxdistributeruser/disAndroidLoginWork/',
  '/api/nxdistributeruser/disUserSaveWithFile',
  '/api/nxdistributeruser/weighterKfUserSaveWithFile',
  '/api/nxdistributeruser/disDriverUserLogin',
  '/api/nxdistributer/disAndUserSave',
  '/api/nxdistributer/disAndUserSaveWork',
  '/api/nxdistributer/jjshUserSaveWithFile',
  '/api/nxdistributer/jjshUserSaveWithFileInvite',
  '/api/nxdistributer/jjshUserSaveWithFileByGbInvite',
  '/api/syscitymarket/jjshGetMarket',
  '/api/nxdistributer/getInviteCode'
]

function isPublicApi(url) {
  const target = String(url || '')
  return PUBLIC_PATHS.some(path => target.indexOf(path) > -1)
}

// 只允许本系统 API 携带会话凭证。
// 不能仅用路径特征判断，否则任何第三方地址（只要路径含 /api/）都会收到凭证。
function isTrustedApi(url) {
  const target = String(url || '')
  if (target.indexOf('/api/') === -1) return false
  const configured = typeof apiUrl === 'object' && apiUrl ? String(apiUrl.server || apiUrl.apiUrl || '') : ''
  const hosts = [configured, 'https://test-api.grainservice.club', 'https://api.grainservice.club']
  return hosts.some(base => base && target.indexOf(base.replace(/\/$/, '')) === 0)
}


// 需要按货架责任范围收敛的接口：这些请求必须进入 Owner 鉴权链路，
// 否则服务端拿不到可信身份，无法按员工负责货架过滤与拦截。
// 仅定点覆盖 Picker 实际使用的货架/库存接口，不改写其它请求。
const SHELF_SCOPE_PATHS = [
  '/api/nxdistributergoodsshelf/',
  '/api/nxdistributergoodsshelfstock/',
  // 订单称重与扣库：模式6 下会按货架责任校验实际扣减批次，必须携带可信身份。
  '/api/nxdepartmentorders/pickerGiveOrderWeight',
  '/api/nxdepartmentorders/pickerGiveOrderWeightUpdateShelfStock'
]

function needsOwnerRoute(url) {
  const target = String(url || '')
  return SHELF_SCOPE_PATHS.some(p => target.indexOf(p) > -1)
}

// 改写到 Owner 鉴权前缀，参数与响应合同保持不变。
function toOwnerUrl(url) {
  const value = String(url || '')
  if (value.indexOf('/api/owner/') > -1) return value
  return value.replace('/api/', '/api/owner/')
}

function token() {
  try {
    return wx.getStorageSync(TOKEN_KEY) || ''
  } catch (e) {
    return ''
  }
}

function isExpired() {
  try {
    const expiresAt = wx.getStorageSync(EXPIRES_KEY)
    if (!expiresAt) return false
    const at = Date.parse(expiresAt)
    // 后端时间是 yyyy-MM-dd HH:mm:ss，Date.parse 在部分基础库不可用，
    // 解析失败时不主动清理，交由后端判定，避免误删有效会话。
    if (isNaN(at)) return false
    return at <= Date.now()
  } catch (e) {
    return false
  }
}

function clear() {
  try {
    wx.removeStorageSync(TOKEN_KEY)
    wx.removeStorageSync(EXPIRES_KEY)
  } catch (e) {}
}

// 从登录接口返回体中保存服务端签发的会话凭证。
// 兼容 data 直接挂在 result 上或挂在 result.data 上的两种形态。
function pickStored(auth) {
  // 称重员 Token 优先，避免老板会话覆盖称重员身份。
  return wx.getStorageSync(WEIGHER_TOKEN_KEY) || wx.getStorageSync(TOKEN_KEY) || ''
}

function capture(responseData) {
  const source = responseData && responseData.data ? responseData.data : responseData
  // 称重员会话与老板会话分列，避免两类身份互相覆盖。
  const auth = (source && source.weigherAuth) || (source && source.ownerAuth)
  if (!auth || !auth.accessToken) return false
  const weigher = !!(source && source.weigherAuth)
  try {
    wx.setStorageSync(weigher ? WEIGHER_TOKEN_KEY : TOKEN_KEY, auth.accessToken)
    wx.setStorageSync(weigher ? WEIGHER_EXPIRES_KEY : EXPIRES_KEY, auth.expiresAt || '')
    return true
  } catch (e) {
    return false
  }
}

// 全局安装一次：所有 Picker 请求自动带上 Owner 凭证。
// 未登录（无凭证）时不改动请求头，保证现有登录与注册流程不受影响。
function install() {
  if (install.done) return
  install.done = true

  function authorizeOptions(options) {
    const opts = options || {}
    let url = opts.url || ''
    if (needsOwnerRoute(url)) {
      url = toOwnerUrl(url)
      opts.url = url
    }
    if (
      isTrustedApi(url) &&
      !isPublicApi(url) &&
      opts.ownerAuth !== false &&
      !isExpired()
    ) {
      const value = pickStored()
      if (value) {
        const header = opts.header || {}
        const hasOwnerToken = Object.keys(header).some(
          key => String(key).toLowerCase() === 'x-nx-owner-token'
        )
        if (!hasOwnerToken) {
          opts.header = Object.assign({}, header, { 'X-NX-Owner-Token': value })
        }
      }
    }
    return opts
  }

  const originalRequest = wx.request
  wx.request = function (options) {
    return originalRequest.call(wx, authorizeOptions(options))
  }

  // 库存模板使用 wx.uploadFile；它不会经过 wx.request 包装，必须应用同一条
  // Owner 路由与会话凭证规则，否则服务端无法识别称重员及其责任货架。
  const originalUploadFile = wx.uploadFile
  if (typeof originalUploadFile === 'function') {
    wx.uploadFile = function (options) {
      return originalUploadFile.call(wx, authorizeOptions(options))
    }
  }
}

module.exports = {
  install,
  capture,
  clear,
  token,
  pickStored,
  needsOwnerRoute,
  toOwnerUrl,
  isExpired,
  isPublicApi,
  isTrustedApi,
  TOKEN_KEY,
  EXPIRES_KEY,
  WEIGHER_TOKEN_KEY,
  WEIGHER_EXPIRES_KEY
}
