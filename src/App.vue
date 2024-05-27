
<template>
  <header class="header-toolbar">
    <el-card style="width: 100%;height: 70px;">
      <el-switch v-model="scanSwitch" active-text="扫描" inactive-text="关" style="margin-right: 10px;" />
      <el-select placeholder="选择配对的设备" value-key="key" :no-data-text="scanSwitch ? '扫描中' : '请先开始扫描'"
        v-model="selectedDevice" style="width: 250px">
        <el-option v-for="device in deviceList" :key="device.key" :label="device.key" :value="device" />
      </el-select>
      <span>同屏展示数: <el-input-number v-model="maxFrameCount" :min="1" controls-position="right" /></span>
      <span>旧帧保留数: <el-input-number v-model="maxOldFrameCount" :min="0" controls-position="right" /></span>
      <span v-if="isDebugMode">
        {{ dataFrame }}
      </span>
    </el-card>
  </header>
  <main>
    <BrakePedalRateDiagram style="height: calc(100vh - 100px)" :data="dataFrame" :old-data="oldData"
      :init-frames="initFrames" :max-frame="maxFrameCount" :max-old-frame="maxOldFrameCount" @save="saveOldData" />
  </main>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, readonly, ref, watch } from 'vue';
import { IBrakePedalStateFrame, syncState } from './support/bluetooth';
import { BtInfo, startScanDevice, pair, stopScanDevice } from './support/bluetooth';
import { makeDelayExecuteor } from './support/jsExpend'
import BrakePedalRateDiagram from './components/diagrams/BrakePedalRateDiagram.vue'
import { OldFrameDateLike } from './components/diagrams/BrakePedalDiagramConstant';
import { ElMessage } from 'element-plus';
class BrakePedalStateFrame implements IBrakePedalStateFrame {
  acc: number;
  pressure: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  constructor(acc: number,
    pressure: number,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number) {
    this.acc = acc;
    this.pressure = pressure;
    this.year = year;
    this.month = month;
    this.day = day;
    this.hour = hour;
    this.minute = minute;
    this.second = second;

  }
}

const scanSwitch = ref(false);

const selectedDevice = ref<BtInfo>();

const deviceList = ref<BtInfo[]>([]);

const dataFrame = ref<IBrakePedalStateFrame>();
updateFrame();

const isDebugMode = (() => {
  const param = new URLSearchParams(window.location.search).get('debug');
  if (param) {
    return param === 'on' || param === 'true';
  }
  return false;
})()

const maxFrameCount = readCountStore(50, '$$_BK_MaxFrameCount_$$');

const maxOldFrameCount = readCountStore(50, '$$_BK_MaxOldFrameCount_$$');

function readCountStore(defaultV: number, key: string) {
  const v = ref(defaultV);
  watch(v, nv => {
    if (typeof nv !== 'number') {
      return;
    }
    localStorage.setItem(key, nv.toString());
  });

  const str = localStorage.getItem(key);
  if (str) {
    const numberLike = parseInt(str);
    if (Number.isNaN(numberLike)) {
      return v;
    }
    v.value = numberLike;
  }
  return v;
}

const initFrames = (() => {
  if (!isDebugMode) {
    return undefined;
  }
  const now = new Date();
  now.setSeconds(now.getSeconds() - 52);
  // return [];
  return Array.from({ length: maxFrameCount.value }, () => {
    now.setSeconds(now.getSeconds() + 1);
    return new BrakePedalStateFrame(
      Math.floor(Math.random() * 100),
      Math.floor(Math.random() * 100),
      2024,
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
  })
})()

const oldDataKey = '$$BK_OLD_DATA_FRAMES_$$';

const oldData = (() => {
  // return { "acc": [88, 48, 70, 28, 47, 8, 7, 10, 38, 70, 89, 87, 46, 65, 17, 28, 57, 56, 37, 9, 32], "pressure": [7, 18, 30, 31, 75, 36, 11, 81, 66, 21, 6, 85, 3, 7, 89, 31, 84, 75, 16, 13, 77], "date": [1712383034555, 1712383035555, 1712383036555, 1712383037555, 1712383038555, 1712383039555, 1712383040555, 1712383041555, 1712383042555, 1712383043555, 1712383044555, 1712383058692, 1712383059692, 1712383060692, 1712383061692, 1712383062692, 1712383123830, 1712383124830, 1712383125830, 1712383126830, 1712383127830] }
  const d = localStorage.getItem(oldDataKey);
  if (d) {
    return JSON.parse(d) as OldFrameDateLike
  }
  return undefined;
})()

const saveOldData = (d: OldFrameDateLike) => {
  localStorage.setItem(oldDataKey, JSON.stringify(d));
}

const reciveScanList = (devices: BtInfo[]) => {
  deviceList.value = devices;
}

const reciveDataFrame = (frame: IBrakePedalStateFrame) => {
  dataFrame.value = frame;
}

const selectDevice = (device: BtInfo) => {
  pair(device).then(({ handleFrame }) => {
    ElMessage.success('配对成功');
    handleFrame(reciveDataFrame);
  }).catch((resone: string) => {
    ElMessage.error('配对失败. 原因: ' + resone);
  })
}

watch(selectedDevice, makeDelayExecuteor(selectDevice, 250))

watch(scanSwitch, makeDelayExecuteor(on => {
  try {
    if (!on) {
      stopScanDevice();
      return;
    }
    console.log('scanDevices');
    startScanDevice().whenScaned(reciveScanList)
  } catch (e) {
    alert('网络错误!')
    console.error(e);
  }
}, 500))

function updateFrame() {
  const d = new Date();
  dataFrame.value = new BrakePedalStateFrame(
    Math.floor(Math.random() * 100),
    Math.floor(Math.random() * 100),
    2024,
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds()
  );
}

// 同步服务器的现在的蓝牙配置
const { whenScaned, handleFrame, whenPaired } = syncState();
whenScaned(reciveScanList);
handleFrame(reciveDataFrame);
whenPaired(device => {
  selectedDevice.value = device;
})

let timer: any;

onMounted(() => {
  if (isDebugMode) {
    timer = setInterval(updateFrame, 1000);
  }
})

onUnmounted(() => {
  clearInterval(timer);
})


</script>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}


/* .header-toolbar {} */

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
