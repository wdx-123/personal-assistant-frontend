/**
 * 路由配置
 */

import { createRouter, createWebHistory } from "vue-router";
import { basicRoutes } from "./routes";

const router = createRouter({
  history: createWebHistory(),
  routes: basicRoutes,
});

export default router;
