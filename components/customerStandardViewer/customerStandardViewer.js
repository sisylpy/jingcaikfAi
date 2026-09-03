import apiUrl from '../../config.js'
import { pickerGetOrderCustomerStandard } from '../../lib/apiDepOrder.js'

const DIMENSION_LABELS = {
  SIZE: '大小',
  COLOR: '颜色',
  FRESHNESS: '新鲜度',
  ROOT: '根部',
  PACKAGING: '包装',
  SUBSTITUTE: '替代',
  OTHER: '其他'
}

const DIMENSION_ORDER = ['SIZE', 'COLOR', 'FRESHNESS', 'ROOT', 'PACKAGING', 'SUBSTITUTE', 'OTHER']
const IMAGE_ROLES = [
  { code: 'PASS', name: '合格参考', className: 'pass' },
  { code: 'PROHIBITED', name: '禁止这样', className: 'prohibited' },
  { code: 'REFERENCE', name: '参考', className: 'reference' }
]

Component({
  properties: {
    show: { type: Boolean, value: false },
    order: { type: Object, value: null },
    goodsName: { type: String, value: '' },
    customerName: { type: String, value: '' },
    distributerId: { type: Number, value: 0 },
    weightUserId: { type: Number, value: 0 },
    supplierId: { type: Number, value: -1 }
  },

  data: {
    loading: false,
    errorMessage: '',
    standardGroups: [],
    generalImageSections: [],
    hasContent: false
  },

  observers: {
    'show, order.nxDepartmentOrdersId': function(show) {
      if (show) this.loadCurrentStandard()
    }
  },

  methods: {
    stopEvent() {},

    closeViewer() {
      this.triggerEvent('close')
    },

    retryLoad() {
      this.loadCurrentStandard()
    },

    loadCurrentStandard() {
      const order = this.data.order || {}
      const departmentDisGoodsId = Number(order.nxDoDepDisGoodsId)
      const orderId = Number(order.nxDepartmentOrdersId)
      const distributerId = Number(this.data.distributerId)
      const weightUserId = Number(this.data.weightUserId)

      if (!departmentDisGoodsId || !orderId || !distributerId || !weightUserId) {
        this.setData({
          loading: false,
          errorMessage: '订单缺少客户商品标准身份，请刷新后重试',
          standardGroups: [],
          generalImageSections: [],
          hasContent: false
        })
        return
      }

      this.setData({
        loading: true,
        errorMessage: '',
        standardGroups: [],
        generalImageSections: [],
        hasContent: false
      })

      pickerGetOrderCustomerStandard({
        departmentDisGoodsId,
        orderId,
        distributerId,
        weightUserId,
        supplierId: Number(this.data.supplierId) > 0 ? Number(this.data.supplierId) : undefined
      }).then((res) => {
        if (!res.result || res.result.code !== 0) {
          throw new Error((res.result && res.result.msg) || '客户标准加载失败')
        }
        const view = this.buildView(res.result.data || {})
        this.setData({
          loading: false,
          standardGroups: view.groups,
          generalImageSections: view.generalImageSections,
          hasContent: view.hasContent
        })
      }).catch((error) => {
        this.setData({
          loading: false,
          errorMessage: error && error.message ? error.message : '客户标准加载失败'
        })
      })
    },

    buildView(current) {
      const rawItems = Array.isArray(current.items) ? current.items : []
      const rawImages = Array.isArray(current.images) ? current.images : []
      const images = rawImages.map((image) => this.normalizeImage(image))

      const items = rawItems.map((item) => {
        const itemId = item.nxDdgsiId
        const dimensionCode = item.nxDdgsiDimensionCode || 'OTHER'
        const importance = Number(item.nxDdgsiImportanceLevel || 3)
        return {
          itemId,
          dimensionCode,
          requirementText: item.nxDdgsiRequirementText || '',
          importanceLevel: importance,
          stars: '★★★★★'.slice(0, Math.max(1, Math.min(5, importance))),
          sort: Number(item.nxDdgsiSort || 0),
          imageSections: this.buildImageSections(images.filter((image) =>
            String(image.standardItemId || '') === String(itemId)
          ))
        }
      })

      const groupMap = {}
      items.forEach((item) => {
        const code = item.dimensionCode
        if (!groupMap[code]) {
          groupMap[code] = {
            code,
            name: DIMENSION_LABELS[code] || code,
            maxImportance: 0,
            items: []
          }
        }
        groupMap[code].items.push(item)
        groupMap[code].maxImportance = Math.max(groupMap[code].maxImportance, item.importanceLevel)
      })

      const groups = Object.keys(groupMap).map((code) => {
        const group = groupMap[code]
        group.items.sort((a, b) => b.importanceLevel - a.importanceLevel || a.sort - b.sort)
        return group
      }).sort((a, b) => {
        const aIndex = DIMENSION_ORDER.indexOf(a.code)
        const bIndex = DIMENSION_ORDER.indexOf(b.code)
        return b.maxImportance - a.maxImportance ||
          (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex)
      })

      const generalImages = images.filter((image) => !image.standardItemId)
      return {
        groups,
        generalImageSections: this.buildImageSections(generalImages),
        hasContent: items.length > 0 || images.length > 0
      }
    },

    normalizeImage(image) {
      const role = image.nxDdgimgImageRole || 'REFERENCE'
      const imageUrl = image.nxDdgimgImageUrl || ''
      return {
        imageId: image.nxDdgimgId,
        standardItemId: image.nxDdgimgStandardItemId,
        imageRole: role,
        previewUrl: this.absoluteImageUrl(imageUrl),
        description: image.nxDdgimgDescription || '',
        importanceLevel: Number(image.nxDdgimgImportanceLevel || 3),
        sort: Number(image.nxDdgimgSort || 0)
      }
    },

    buildImageSections(images) {
      return IMAGE_ROLES.map((role) => ({
        role: role.code,
        name: role.name,
        className: role.className,
        images: images.filter((image) => image.imageRole === role.code)
          .sort((a, b) => b.importanceLevel - a.importanceLevel || a.sort - b.sort)
      })).filter((section) => section.images.length > 0)
    },

    absoluteImageUrl(imageUrl) {
      if (!imageUrl) return ''
      if (/^(https?:|wxfile:|blob:)/i.test(imageUrl)) return imageUrl
      return apiUrl.server + imageUrl.replace(/^\//, '')
    }
  }
})
