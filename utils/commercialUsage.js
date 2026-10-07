var STORAGE_KEY = 'commercialUsage';

function saveFromLogin(data) {
  if (data && data.commercialUsage) {
    wx.setStorageSync(STORAGE_KEY, data.commercialUsage);
  }
}

function isQuotaExhausted(result) {
  return !!result && result.errorCode === 'USAGE_QUOTA_EXHAUSTED';
}

function showQuotaExhausted(result) {
  if (!isQuotaExhausted(result)) return false;
  var meterName = result.meterCode === 'ORDER_LINE' ? '订单处理额度' : '业务额度';
  wx.showModal({
    title: meterName + '不足',
    content: '本次需要 ' + (result.required || 1) + '，当前可用 '
      + (result.available || 0) + '。请联系管理员补充额度。',
    showCancel: false
  });
  return true;
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  saveFromLogin: saveFromLogin,
  isQuotaExhausted: isQuotaExhausted,
  showQuotaExhausted: showQuotaExhausted
};
