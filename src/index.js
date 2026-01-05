import './css/loaders.css';
import './css/swiper.css';
import './css/mini-tokyo-3d.css';

import MapboxLanguage from '@mapbox/mapbox-gl-language';
import Popup from './popup';
import MapAdapter from './map-adapter';
import DataManager from './data-manager';
import TrafficManager from './traffic-manager';
import UIManager from './ui-manager';
import { preloadAssets } from './preloader';
import { hkBusSimulator } from './data/hkBusSimulator.js'; // 你已添加的导入

// 1. 首先，替换掉默认的颜色配置，定义香港巴士颜色
const operatorColors = {
  'KMB': '#E2231A', // 九巴红
  'CTB': '#FFD100', // 城巴/新巴黄
  'NWFB': '#FFD100',
  'NLB': '#6DCFF6',  // 新大屿山蓝
  // 可以保留原项目的其他运营商颜色，或暂时清空
};

// 2. 应用启动主函数
async function main() {
  await preloadAssets();

  const mapAdapter = new MapAdapter();
  const dataManager = new DataManager();
  const trafficManager = new TrafficManager(mapAdapter, dataManager);
  const uiManager = new UIManager(mapAdapter, dataManager, trafficManager);
  const popup = new Popup(mapAdapter, dataManager);

  // 初始化各个管理器
  await dataManager.init();
  mapAdapter.init(trafficManager, popup);
  trafficManager.init(uiManager);
  uiManager.init(popup);
  popup.init();

  // 3. 关键步骤：启动香港巴士模拟器，并监听其数据
  hkBusSimulator.start();
  console.log('香港巴士模拟器已启动');

  // 监听模拟器发送的数据事件
  window.addEventListener('hkbusdata', (event) => {
    const hkBuses = event.detail;
    // 4. 将数据传递给 trafficManager，这是让地图显示车辆的关键！
    // 原项目通过 trafficManager 来更新所有车辆，我们“注入”自己的数据
    if (trafficManager && trafficManager.updateVehicles) {
      // 注意：这里可能需要根据数据格式做简单转换
      trafficManager.updateVehicles(hkBuses);
    }
  });

  // 5. （可选但推荐）覆盖原项目的运营商颜色配置
  // 尝试将我们定义的 colors 合并到数据管理器中
  if (dataManager.config) {
    dataManager.config.operatorColors = { ...dataManager.config.operatorColors, ...operatorColors };
  }
}

// 启动应用
main().catch(console.error);
