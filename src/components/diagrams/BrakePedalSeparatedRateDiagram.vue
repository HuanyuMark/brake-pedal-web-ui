
<template>
    <BaseDiagram :option="option" @echar-mounted="ins => echartsIns = ins"></BaseDiagram>
</template>

<script setup lang="ts">
import { EChartsType, LinearGradient, LineSeriesOption } from './echarts';
import BaseDiagram from './BaseDiagram.vue';
import { IBrakePedalStateFrame } from '../../support/bluetooth';
import { computed, onActivated, onDeactivated, watch } from 'vue';

export interface BrakePedalSeparatedRateDiagramProps {
    data: IBrakePedalStateFrame,
    // >= 则淘汰最老的
    maxFrame: number,
    criterion: 'acc' | 'pressure'
}

// const frameQueue = computed((() => {
//     const all: IBrakePedalStateFrame[] = [];
//     return () => {
//         if (all.length >= props.maxFrame) {
//             all.shift();
//         }
//         all.push(props.data);
//         return all;
//     }
// })());

const data = computed((() => {
    const all: [string, number][] = [];
    return () => {
        if (all.length >= props.maxFrame) {
            all.shift();
        }
        const record = props.data;
        all.push([
            `${record.year}-${record.month}-${record.day}-${record.hour}-${record.minute}-${record.second}`,
            record[props.criterion]
        ]);
        return all;
    }
})())

// const emit = defineEmits<{
//     (e: 'export-data', ds: typeof data): void
// }>()

// emit('export-data', data);

const dataZoomId = 'dataSyncZoomID';

const props = withDefaults(defineProps<BrakePedalSeparatedRateDiagramProps>(), {
    maxFrame: 500
});

const option: LineSeriesOption = {
    // 图表标题
    title: {
        text: `刹车片 ${props.criterion === 'acc' ? '加速度' : '压力'} 随时间变化图`,
        left: 'center'
    },
    // X轴配置
    xAxis: {
        type: 'time',
        name: '时间',
        axisLabel: {
            // formatter: '{yyyy}-{MM}-{dd}',
            formatter: '{hh}-{mm}-{ss}',
        }
    },
    // Y轴配置
    yAxis: {
        type: 'value',
        name: props.criterion === 'acc' ? '加速度单位' : 'N',
        splitLine: { show: true }, // 可选：隐藏网格线
    },
    // 系列配置（折线图）
    series: [
        {
            name: props.criterion === 'acc' ? '加速度曲线' : '压力曲线',
            type: 'line',
            smooth: true, // 可选：启用平滑曲线
            lineStyle: {
                color: '#FFC107', // 可选：自定义折线颜色
            },
            areaStyle: {
                opacity: 0.2, // 可选：添加区域填充效果并设置透明度
                color: new LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: '#FFC107',
                }, {
                    offset: 1,
                    color: '#FFE082',
                }]),
            },
            emphasis: {
                focus: 'series',
            },
            data: data.value,
        }
    ],
    // 工具箱（可选）
    toolbox: {
        show: true,
        feature: {
            dataZoom: {},
            restore: {},
            saveAsImage: {
                show: true,
                type: 'png'
            }
        }
    },
    // 提示框（鼠标悬停显示详细信息）
    tooltip: {
        trigger: 'axis',
        formatter: function (params) {
            return `${JSON.stringify(params)}`;
        }
    },
    dataZoom: [{
        id: dataZoomId,
        name: dataZoomId,
        type: 'inside', // 内置型数据区域缩放组件
        start: 0,       // 数据窗口起始比例，默认从0开始
        end: 100,       // 数据窗口结束比例，默认显示所有数据（100%）
        filterMode: 'filter', // 数据过滤模式，选择'empty'则保留原数据点，但不绘制；选择'filter'则完全剔除不在窗口内的数据点
        realtime: true, // 实时响应数据窗口变化
    }],
}


let lastDataZoomEnd = 0; // 上一次数据窗口结束位置（初始为0）
const updateTemplate = {
    series: [
        {
            name: props.criterion === 'acc' ? '加速度曲线' : '压力曲线',
            data: data.value
        }
    ],
    dataZoom: [{
        id: dataZoomId,
        name: dataZoomId,
        end: lastDataZoomEnd / data.value.length * 100, // 转换为百分比形式
    }],
}

let actived = true;
onActivated(() => {
    actived = true;
})
onDeactivated(() => {
    actived = false;
})

let echartsIns: EChartsType;
watch(data, data => {
    if (!actived) {
        return;
    }
    // merge option and flush diagram
    updateTemplate.series[0].data = data;
    updateTemplate.dataZoom[0].end = lastDataZoomEnd / data.length * 100;
    echartsIns?.setOption(updateTemplate, true);
})

</script>