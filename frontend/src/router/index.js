import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../layout/DashboardLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/DashboardOverview.vue')
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/UserProfile.vue')
      },
      {
        path: 'inventory-stock',
        name: 'InventoryStock',
        component: () => import('../views/InventoryStock.vue')
      },
      {
        path: 'inventory-receive',
        name: 'InventoryReceive',
        component: () => import('../views/InventoryReceive.vue')
      },
      {
        path: 'inventory-history',
        name: 'InventoryHistory',
        component: () => import('../views/InventoryHistory.vue')
      },
      {
        path: 'asset-list',
        name: 'AssetList',
        component: () => import('../views/AssetList.vue')
      },
      {
        path: 'new-asset',
        name: 'NewAsset',
        component: () => import('../views/NewAsset.vue')
      },
      {
        path: 'asset-distribution',
        name: 'AssetDistribution',
        component: () => import('../views/AssetDistribution.vue')
      },
      {
        path: 'asset-timeline',
        name: 'AssetTimeline',
        component: () => import('../views/AssetTimeline.vue')
      },
      {
        path: 'requisition-management',
        name: 'RequisitionManagement',
        component: () => import('../views/RequisitionManagement.vue')
      },
      {
        path: 'new-requisition',
        name: 'NewRequisition',
        component: () => import('../views/NewRequisition.vue')
      },
      {
        path: 'master-data',
        name: 'MasterData',
        component: () => import('../views/MasterData.vue')
      },
      {
        path: 'activity-logs',
        name: 'ActivityLogs',
        component: () => import('../views/ActivityLogs.vue')
      },
      {
        path: 'report-export',
        name: 'ReportExport',
        component: () => import('../views/ReportExport.vue')
      },
      {
        path: 'asset-disposal',
        name: 'AssetDisposal',
        component: () => import('../views/AssetDisposal.vue')
      },
      {
        path: 'inventory-check',
        name: 'InventoryCheck',
        component: () => import('../views/InventoryCheck.vue')
      },
      {
        path: 'maintenance-repair',
        name: 'MaintenanceRepair',
        component: () => import('../views/MaintenanceRepair.vue')
      },
      {
        path: 'borrow-return',
        name: 'BorrowReturn',
        component: () => import('../views/BorrowReturn.vue')
      },
      {
        path: 'fiscal-year-settings',
        name: 'FiscalYearSettings',
        component: () => import('../views/FiscalYearSettings.vue')
      }
    ]
  },
  {
    path: '/print-requisition/:id',
    name: 'PrintRequisition',
    component: () => import('../views/PrintRequisition.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ตรวจสอบสถานะการล็อกอิน (mock ด้วย localStorage ไปก่อนจนกว่าจะต่อ API จริง)
function isAuthenticated() {
  return !!localStorage.getItem('tcaims_auth_token')
}

router.beforeEach((to, from) => {
  const loggedIn = isAuthenticated()

  if (to.name !== 'Login' && !loggedIn) {
    // ยังไม่ล็อกอิน แต่พยายามเข้าหน้าอื่น -> เด้งไปหน้า login
    return { name: 'Login', query: { redirect: to.fullPath } }
  } else if (to.name === 'Login' && loggedIn) {
    // ล็อกอินอยู่แล้ว แต่พยายามเข้าหน้า login -> เด้งเข้า Dashboard
    return { name: 'Dashboard' }
  }
})

export default router