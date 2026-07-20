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
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
