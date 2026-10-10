function entitledFeatures(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.entitledFeatures)) return [];
  return snapshot.entitledFeatures;
}

function effectiveOperatingFeatures(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.effectiveFeatures)) return [];
  return snapshot.effectiveFeatures;
}

function hasFeature(snapshot, featureCode) {
  return entitledFeatures(snapshot).indexOf(featureCode) !== -1;
}

function isShelfBusinessType(disInfo) {
  if (!disInfo) return false;
  var value = Number(disInfo.nxDistributerBusinessTypeId);
  return value >= 3 && value <= 5;
}

function resolveOutboundWorkflow(disInfo, snapshot) {
  return hasFeature(snapshot, 'INVENTORY_OUTBOUND') && isShelfBusinessType(disInfo)
    ? 'SHELF_OUTBOUND'
    : 'NORMAL_OUTBOUND';
}

function canUseShelfWorkflow(disInfo, snapshot) {
  return resolveOutboundWorkflow(disInfo, snapshot) === 'SHELF_OUTBOUND';
}

function canInitializeShelfStock(disInfo, operatingCapability) {
  if (!disInfo) return false;
  var modeCode = disInfo.nxDistributerOperatingModeCode;
  if (modeCode) {
    return modeCode === 'SHELF_TRIAL' &&
      effectiveOperatingFeatures(operatingCapability).indexOf('SHELF_STOCK_INITIALIZATION') !== -1;
  }
  // 未迁移老客户继续沿用原入口，不因经营模式 V2 上线被收缩。
  return Number(disInfo.nxDistributerType) === -1;
}

module.exports = {
  hasFeature: hasFeature,
  isShelfBusinessType: isShelfBusinessType,
  resolveOutboundWorkflow: resolveOutboundWorkflow,
  canUseShelfWorkflow: canUseShelfWorkflow,
  canInitializeShelfStock: canInitializeShelfStock
};
