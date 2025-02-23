import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Server from '../views/Server.vue'
import Friends from '../views/Friends.vue'
import AddFriend from '../views/AddFriend.vue'
import Profile from '../views/Profile.vue'
import DirectMessage from '../views/DirectMessage.vue'
import AddServer from '../views/AddServer.vue'
import LoginRegister from '../views/LoginRegister.vue'  // Composant pour connexion/inscription

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: LoginRegister
  },
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/server/:id',
    name: 'server',
    component: Server,
    meta: { requiresAuth: true }
  },
  {
    path: '/friends',
    name: 'friends',
    component: Friends,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-friend',
    name: 'add-friend',
    component: AddFriend,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/:id',
    name: 'direct-message',
    component: DirectMessage,
    meta: { requiresAuth: true }
  },
  {
    path: '/add-server',
    name: 'add-server',
    component: AddServer,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Garde globale pour protéger les routes nécessitant une authentification
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
