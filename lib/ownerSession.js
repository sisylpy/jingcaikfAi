// Picker 员工会话凭证。
// 复用后端已签发的 ownerAuth（企业微信 js_code 换 open_userid 后由服务端签发，
// 绑定员工 ID、配送商 ID、角色、有效期与撤销状态），不另造登录体系。
// 这里只负责保存并在后续请求上自动携带，让后端能够识别真实调用者。

const TOKEN_KEY = 'ownerAccessToken'
const EXPIRES_KEY = 'ownerTokenExpiresAt'

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
function capture(responseData) {
  const source = responseData && responseData.data ? responseData.data : responseData
  const auth = source && source.ownerAuth
  if (!auth || !auth.accessToken) return false
  try {
    wx.setStorageSync(TOKEN_KEY, auth.accessToken)
    wx.setStorageSync(EXPIRES_KEY, auth.expiresAt || '')
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
  const originalRequest = wx.request
  wx.request = function (options) {
    const opts = options || {}
    const url = opts.url || ''
    if (
      !isPublicApi(url) &&
      String(url).indexOf('/api/') > -1 &&
      opts.ownerAuth !== false &&
      !isExpired()
    ) {
      const value = token()
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
    return originalRequest.call(wx, opts)
  }
}

module.exports = {
  install,
  capture,
  clear,
  token,
  isExpired,
  isPublicApi,
  TOKEN_KEY,
  EXPIRES_KEY
}