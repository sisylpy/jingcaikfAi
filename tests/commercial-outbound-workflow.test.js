const test = require('node:test');
const assert = require('node:assert/strict');
const workflow = require('../utils/commercialEntitlement.js');

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
