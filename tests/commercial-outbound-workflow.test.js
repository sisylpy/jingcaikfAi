const test = require('node:test');
const assert = require('node:assert/strict');
const workflow = require('../utils/commercialEntitlement.js');
const usage = require('../utils/commercialUsage.js');
const fs = require('node:fs');
const path = require('node:path');

const basic = { entitledFeatures: ['OUTBOUND'] };
const shelf = { entitledFeatures: ['OUTBOUND', 'INVENTORY_OUTBOUND'] };

test('BASIC always uses normal outbound even for a shelf-shaped business', () => {
  assert.equal(workflow.resolveOutboundWorkflow(
    { nxDistributerBusinessTypeId: 3 }, basic), 'NORMAL_OUTBOUND');
});

test('SHELF entitlement and shelf business shape enable FIFO outbound', () => {
  assert.equal(workflow.resolveOutboundWorkflow(
    { nxDistributerBusinessTypeId: 3 }, shelf), 'SHELF_OUTBOUND');
});

test('commercial entitlement does not rewrite a non-shelf business workflow', () => {
  assert.equal(workflow.resolveOutboundWorkflow(
    { nxDistributerBusinessTypeId: 1 }, shelf), 'NORMAL_OUTBOUND');
});

test('missing subscription never silently enables shelf outbound', () => {
  assert.equal(workflow.resolveOutboundWorkflow(
    { nxDistributerBusinessTypeId: 3 }, null), 'NORMAL_OUTBOUND');
});

test('new usage quota error is recognized without linking to the old points page', () => {
  assert.equal(usage.isQuotaExhausted({ errorCode: 'USAGE_QUOTA_EXHAUSTED' }), true);
  assert.equal(usage.isQuotaExhausted({ errorCode: 'FEATURE_NOT_ENTITLED' }), false);
});

test('only explicit shelf trial with effective grant shows stock initialization', () => {
  assert.equal(workflow.canInitializeShelfStock(
    { nxDistributerOperatingModeCode: 'SHELF_TRIAL' },
    { effectiveFeatures: ['SHELF_STOCK_INITIALIZATION'] }), true);
  assert.equal(workflow.canInitializeShelfStock(
    { nxDistributerOperatingModeCode: 'SHELF_STANDARD' },
    { effectiveFeatures: ['SHELF_STOCK_INITIALIZATION'] }), false);
  assert.equal(workflow.canInitializeShelfStock(
    { nxDistributerOperatingModeCode: 'SHELF_TRIAL' },
    { effectiveFeatures: [] }), false);
});

test('legacy trial entrance remains available before explicit migration', () => {
  assert.equal(workflow.canInitializeShelfStock(
    { nxDistributerType: -1 }, null), true);
});

test('picker stock template uses the server query-parameter contract', () => {
  const source = fs.readFileSync(path.join(__dirname, '../lib/apiDistributer.js'), 'utf8');
  assert.equal(source.includes('downloadShelfStockTemplate/${shelfId}'), false);
  assert.equal(source.includes('downloadShelfStockTemplate?shelfId=${encodeURIComponent(shelfId)}'), true);
});
