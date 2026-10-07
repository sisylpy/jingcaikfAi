function entitledFeatures(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.entitledFeatures)) return [];
  return snapshot.entitledFeatures;
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

module.exports = {
  hasFeature: hasFeature,
  isShelfBusinessType: isShelfBusinessType,
  resolveOutboundWorkflow: resolveOutboundWorkflow,
  canUseShelfWorkflow: canUseShelfWorkflow
};
