// Picker 会话凭证：验证自动携带、公开接口放行与不误伤登录流程。
const test = require('node:test')
const assert = require('node:assert')
const path = require('node:path')

const MODULE_PATH = path.join(__dirname, '..', 'lib', 'ownerSession.js')

function withStorage(initial, run) {
  const store = Object.assign({}, initial)
  let captured = null
  const fakeWx = {
    getStorageSync: key => (key in store ? store[key] : ''),
    setStorageSync: (key, value) => { store[key] = value },
    removeStorageSync: key => { delete store[key] },
    request: options => { captured = options; return options },
    uploadFile: options => { captured = options; return options }
  }
  global.wx = fakeWx
  try {
    return run({ store, getCaptured: () => captured })
  } finally {
    delete global.wx
    delete require.cache[require.resolve(MODULE_PATH)]
  }
}

function freshModule() {
  return require(MODULE_PATH)
}

test('登录返回 ownerAuth 时保存服务端签发的凭证', () => {
  withStorage({}, ({ store }) => {
    const ownerSession = freshModule()
    const ok = ownerSession.capture({
      userInfo: { nxDistributerUserId: 7 },
      ownerAuth: {
        accessToken: 'server-issued-token',
        expiresAt: '2099-01-01 00:00:00',
        userId: 7,
        distributerId: 173,
        roleCode: 0
      }
    })
    assert.strictEqual(ok, true)
    assert.strictEqual(store.ownerAccessToken, 'server-issued-token')
    assert.strictEqual(store.ownerTokenExpiresAt, '2099-01-01 00:00:00')
  })
})

test('登录返回不含 ownerAuth 时不写入任何凭证', () => {
  withStorage({}, ({ store }) => {
    const ownerSession = freshModule()
    assert.strictEqual(ownerSession.capture({ userInfo: { nxDistributerUserId: 7 } }), false)
    assert.strictEqual(store.ownerAccessToken, undefined)
  })
})

test('业务请求自动携带 X-NX-Owner-Token', () => {
  withStorage({ ownerAccessToken: 'server-issued-token' }, ({ getCaptured }) => {
    const ownerSession = freshModule()
    ownerSession.install()
    wx.request({
      url: 'https://test-api.grainservice.club/api/nxdistributergoodsshelf/disGetShelfList/173',
      header: { 'Content-Type': 'application/json' }
    })
    const sent = getCaptured()
    assert.strictEqual(sent.header['X-NX-Owner-Token'], 'server-issued-token')
    assert.strictEqual(sent.header['Content-Type'], 'application/json')
  })
})

test('登录与注册入口不携带凭证，避免影响身份确认', () => {
  withStorage({ ownerAccessToken: 'server-issued-token' }, ({ getCaptured }) => {
    const ownerSession = freshModule()
    ownerSession.install()
    wx.request({ url: 'https://test-api.grainservice.club/api/nxdistributeruser/wxworkLogin', data: {} })
    assert.strictEqual(getCaptured().header, undefined)
  })
})

test('未登录时不改动请求头，行为与改造前一致', () => {
  withStorage({}, ({ getCaptured }) => {
    const ownerSession = freshModule()
    ownerSession.install()
    wx.request({ url: 'https://test-api.grainservice.club/api/nxdistributergoodsshelf/disGetShelfList/173' })
    assert.strictEqual(getCaptured().header, undefined)
  })
})

test('调用方已自带凭证时不覆盖', () => {
  withStorage({ ownerAccessToken: 'server-issued-token' }, ({ getCaptured }) => {
    const ownerSession = freshModule()
    ownerSession.install()
    wx.request({
      url: 'https://test-api.grainservice.club/api/nxdistributergoodsshelf/disGetShelfList/173',
      header: { 'x-nx-owner-token': 'explicit-token' }
    })
    assert.strictEqual(getCaptured().header['x-nx-owner-token'], 'explicit-token')
    assert.strictEqual(getCaptured().header['X-NX-Owner-Token'], undefined)
  })
})
test('库存模板上传改写到 Owner 路由并携带称重员凭证', () => {
  withStorage({ weigherAccessToken: 'weighter-token' }, ({ getCaptured }) => {
    const ownerSession = freshModule()
    ownerSession.install()
    wx.uploadFile({
      url: 'https://test-api.grainservice.club/nongxinle/api/nxdistributergoodsshelfstock/uploadShelfStock',
      filePath: '/tmp/stock.xls',
      name: 'file'
    })
    const sent = getCaptured()
    assert.strictEqual(sent.url,
      'https://test-api.grainservice.club/nongxinle/api/owner/nxdistributergoodsshelfstock/uploadShelfStock')
    assert.strictEqual(sent.header['X-NX-Owner-Token'], 'weighter-token')
  })
})
test('第三方地址即使含 /api/ 也不携带会话凭证', () => {
  withStorage({ ownerAccessToken: 'server-issued-token' }, ({ getCaptured }) => {
    const ownerSession = freshModule()
    ownerSession.install()
    wx.request({ url: 'https://evil.example.com/api/steal' })
    assert.strictEqual(getCaptured().header, undefined)
  })
})
