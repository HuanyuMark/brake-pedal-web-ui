
<template>
    <el-card>
        <BaseDiagram :key="'BPD-' + instanseId" style="height: 600px" :option="option" @echar-mounted="mounteEchatsIns">
        </BaseDiagram>
    </el-card>
</template>

<script setup lang="ts">
import { EChartsType, LineSeriesOption } from './echarts';
import BaseDiagram from './BaseDiagram.vue';
import { IBrakePedalStateFrame } from '../../support/bluetooth';
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, provide, readonly, Ref, ref, UnwrapRef, watch } from 'vue';
import { PRESSURE_COLOR, ACC_COLOR, markLineDep, OldFrameDate, OldFrameDateLike, unitDep } from './BrakePedalDiagramConstant'
export interface BrakePedalRateDiagramProps {
    data: IBrakePedalStateFrame,
    maxFrame?: number,
    maxOldFrame?: number,
    initFrames?: IBrakePedalStateFrame[],
    oldData?: OldFrameDateLike
}

const instanseId = new Number(Math.random() * 100 + Date.now()).toFixed(0)

const props = withDefaults(defineProps<BrakePedalRateDiagramProps>(), {
    maxFrame: 50,
    maxOldFrame: 0
});

const emit = defineEmits<{
    (e: 'save', data: OldFrameDateLike): void
}>();

type YAxisData = Ref<{ name: Date, value: [Date, number] }[]>;

const doUpdateFrame = (frame: IBrakePedalStateFrame) => {
    const delta = accData.value.length - props.maxFrame;
    if (delta > 0) {
        const oldAccs = accData.value.splice(0, delta);
        const oldPressures = pressureData.value.splice(0, delta);
        const oldDataDelta = oldData.acc.length - props.maxOldFrame;
        if (oldDataDelta > 0) {
            oldData.acc.splice(0, oldDataDelta);
            oldData.pressure.splice(0, oldDataDelta);
            oldData.date.splice(0, oldDataDelta);
        }
        oldAccs.forEach(oldAcc => {
            oldData.acc.push(oldAcc.value[1]);
        })
        oldPressures.forEach(oldPressure => {
            oldData.pressure.push(oldPressure.value[1]);
        })
        oldAccs.forEach(oldAcc => {
            oldData.date.push(oldAcc.name);
        })
    }
    const d = new Date();
    d.setFullYear(frame.year);
    d.setMonth(frame.month);
    d.setDate(frame.day);
    d.setHours(frame.hour);
    d.setMinutes(frame.minute);
    d.setSeconds(frame.second);
    accData.value.push({
        name: d,
        value: [d, frame.acc]
    });
    pressureData.value.push({
        name: d,
        value: [d, frame.pressure]
    })
}

const accData: YAxisData = ref([]);
const pressureData: YAxisData = ref([]);

const accSerieName = '加速度随时间变化曲线';
const pressureSerieName = '压力随时间变化曲线';

const accYAxisName = `加速度 (${unitDep.acc})`;
const pressureYAxisName = `压力 (${unitDep.pressure})`;

const oldData: OldFrameDate = (() => {
    const d: OldFrameDate = {
        acc: [],
        pressure: [],
        date: []
    };
    if (props.oldData) {
        d.date = props.oldData.date.map(t => new Date(t));
        d.acc = props.oldData.acc;
        d.pressure = props.oldData.pressure;
    }
    return d;
})()


const echartsIns = ref<EChartsType>();
const accSerieHoverd = createHoverRef(accSerieName);
const pressureHoverd = createHoverRef(pressureSerieName);
function createHoverRef(seriesName: string) {
    const _ref = ref(false);
    let timer: any;
    const overHandler = (echartsIns: EChartsType) => {
        const handler = (param) => {
            console.log('mouseover', param);
            _ref.value = true;;
            if (timer) {
                clearTimeout(timer);
            }
        };
        echartsIns.on('mouseover', { seriesName, componentType: 'series' }, handler);
        echartsIns.on('legend:hover', console.log);
    }
    const outHandler = (echartsIns: EChartsType) => {
        echartsIns.on('mouseout', { seriesName, componentType: 'series' }, (param) => {
            console.log('mouseout', param);
            timer = setTimeout(() => {
                _ref.value = false;;
            }, 500);
        });
    }
    const bind = (echartsIns: EChartsType) => (overHandler(echartsIns), outHandler(echartsIns));
    if (echartsIns.value) {
        bind(echartsIns.value);
    } else {
        const unwatcher = watch(echartsIns, ins => {
            if (ins) {
                bind(ins);
                unwatcher();
            }
        });
    }

    return readonly(_ref);
}

const doDisplayAxis = (display: boolean, yAxisName: string) => {
    const opacity = display ? 1 : 0.2;
    echartsIns.value?.setOption({
        yAxis: [
            {
                name: yAxisName,
                axisLine: {
                    lineStyle: {
                        opacity,
                    },
                },
                nameTextStyle: {
                    opacity,
                },
                axisLabel: {
                    opacity
                }
            },
        ],
    })
}
const doDisplayMarkArea = (hover: boolean, serieName: string, markArea_: typeof markArea.acc) => {
    const serieIndex = updateMarkAreaTemplate.series.findIndex(serie => serie.name === serieName);
    if (serieIndex < 0) {
        return;
    }
    console.log('doDisplayMarkArea');
    if (hover) {
        if (updateMarkAreaTemplate.series[serieIndex]) {
            updateMarkAreaTemplate.series[serieIndex].markArea = markArea_;
        } else {
            updateMarkAreaTemplate.series[serieIndex] = { name: serieName, markArea: markArea_ }
        }
        console.log(updateMarkAreaTemplate.series);
        echartsIns.value?.setOption(updateMarkAreaTemplate);
    } else {
        console.log(updateMarkAreaTemplate.series);
        const oldSeries = echartsIns.value?.getOption().series;
        updateMarkAreaTemplate.series[serieIndex] = { name: serieName, markArea: undefined };
        oldSeries[serieIndex].markArea = undefined;
        echartsIns.value?.setOption({ series: oldSeries }, {
            replaceMerge: 'series'
        });
    }
}

const doHoverAccSerie = (hover: boolean) => {
    doDisplayAxis(!hover, pressureYAxisName);
    doDisplayMarkArea(hover, accSerieName, markArea.acc);
    // doDisplayVisualMap(hover, accSerieName);
}

const doHoverPressureSerie = (hover: boolean) => {
    doDisplayAxis(!hover, accYAxisName);
    doDisplayMarkArea(hover, pressureSerieName, markArea.pressure);
    // doDisplayVisualMap(hover, pressureSerieName);
}

watch(accSerieHoverd, doHoverAccSerie)

watch(pressureHoverd, doHoverPressureSerie)

const mounteEchatsIns = (ins: EChartsType) => {
    echartsIns.value = ins;
    bindVisualMapUpdator(ins);
}

const createVisualMap = (seriesIndex: number, markLineDepItem: typeof markLineDep.acc) => {
    return {
        type: 'piecewise',
        seriesIndex,
        pieces: [
            { lt: markLineDepItem.maxMin, label: '轻刹', color: 'green', },
            { gte: markLineDepItem.maxMin, lt: markLineDepItem.maxMid, label: '中刹', color: 'yellow', },
            { gte: markLineDepItem.maxMid, label: '重刹', color: 'red', }
        ],
    }
}

const visualMap = {
    acc: createVisualMap(0, markLineDep.acc),
    pressure: createVisualMap(1, markLineDep.pressure),
}

// const doDisplayVisualMap = (display: boolean, serieName: typeof accSerieName | typeof pressureSerieName) => {
//     const params: LegendSelectChangedParams = {
//         selected: { [serieName]: display },
//     }
//     handleLegendSelectChanged(params);
//     doDisplayAxis(false, serieName !== accSerieName ? pressureYAxisName : accYAxisName);
// }

interface LegendSelectChangedParams {
    selected: {
        [accSerieName]?: boolean,
        [pressureSerieName]?: boolean,
    }
}

const handleLegendSelectChanged = (() => {
    const doDispalyAcc = (display: boolean) => {
        doDisplayAxis(!display, pressureYAxisName);
        doDisplayMarkArea(display, accSerieName, markArea.acc);
    }
    const doDispalyPressure = (display: boolean) => {
        doDisplayAxis(!display, accYAxisName);
        doDisplayMarkArea(display, pressureSerieName, markArea.pressure);
    }
    return (params: LegendSelectChangedParams) => {
        console.log(params);
        if (params.selected[accSerieName] && !params.selected[pressureSerieName]) {
            doDispalyAcc(true);
            updateVisualMapTemplate.visualMap = visualMap.acc;
        } else {
            doDispalyAcc(false);
        }
        if (params.selected[pressureSerieName] && !params.selected[accSerieName]) {
            doDispalyPressure(true);
            updateVisualMapTemplate.visualMap = visualMap.pressure;
        } else {
            doDispalyPressure(false);
        }
        console.log(updateVisualMapTemplate);
        if (params.selected[pressureSerieName] && params.selected[accSerieName]) {
            updateVisualMapTemplate.visualMap = undefined;
            doDisplayMarkArea(false, accSerieName, markArea.acc);
            doDisplayMarkArea(false, pressureSerieName, markArea.pressure);
            echartsIns.value?.setOption(updateVisualMapTemplate, {
                replaceMerge: 'visualMap'
            });
        } else {
            echartsIns.value?.setOption(updateVisualMapTemplate);
        }
    }
})()

const bindVisualMapUpdator = (ins: EChartsType) => {
    ins.on('legendselectchanged', handleLegendSelectChanged);
}

const createMarkArea = (dep: typeof markLineDep.acc) => {
    return {
        silent: true,
        data: [
            [
                {
                    yAxis: null,
                    itemStyle: {
                        color: 'green',
                        opacity: 0.2,
                        lable: {
                            show: true,
                            formatter: '轻刹'
                        },
                    },
                },
                {
                    yAxis: dep.maxMin,
                }],
            [
                {
                    yAxis: dep.maxMin,
                    itemStyle: {
                        color: 'yellow',
                        opacity: 0.05,
                        lable: {
                            show: true,
                            formatter: '中刹'
                        },
                    },
                },
                {
                    yAxis: dep.maxMid,
                }
            ],
            [
                {
                    yAxis: dep.maxMid,
                    itemStyle: {
                        color: 'red',
                        opacity: 0.2,
                        lable: {
                            show: true,
                            formatter: '重刹'
                        },
                    },
                },
                {
                    yAxis: null,
                }
            ],
        ],
    }
}

const markArea = {
    acc: createMarkArea(markLineDep.acc),
    pressure: createMarkArea(markLineDep.pressure),
}

if (props.initFrames) {
    props.initFrames.forEach(frame => {
        doUpdateFrame(frame);
    })
} else if (oldData.acc.length > 0) {
    const index = oldData.acc.length - props.maxFrame;
    const rellyOldData: OldFrameDate = {
        acc: oldData.acc.splice(0, index),
        pressure: oldData.pressure.splice(0, index),
        date: oldData.date.splice(0, index)
    }
    accData.value = oldData.acc.map((acc, index) => ({
        name: oldData.date[index],
        value: [oldData.date[index], acc]
    }))
    accData.value = createYAxisData(oldData.acc);
    pressureData.value = createYAxisData(oldData.pressure);
    Object.assign(oldData, rellyOldData);

    function createYAxisData(data: number[]): UnwrapRef<YAxisData> {
        return data.map((value, index) => ({
            name: oldData.date[index],
            value: [oldData.date[index], value]
        }))
    }
}


watch(() => props.data, frame => {
    doUpdateFrame(frame);
    updateFrameTemplate.animation = accData.value.length < props.maxFrame;
    if (accSerieHoverd.value || pressureHoverd.value) {
        return;
    }
    echartsIns.value?.setOption(updateFrameTemplate);
})

const option: LineSeriesOption = {
    animation: accData.value.length < props.maxFrame,
    animationDuration() {
        const res = accData.value.length > props.maxFrame ? 0 : (1 - accData.value.length / props.maxFrame) * 1000;
        console.log('animationDuration', res);
        return res;
    },
    // 图表标题
    title: {
        text: '刹车片状态随时间变化图',
        left: 'center'
    },
    // X轴配置
    xAxis: {
        type: 'time',
        name: '时间',
        minInterval: 1000,
        maxInterval: 3600 * 1000
        // axisLabel: {
        //     // formatter: '{yyyy}-{MM}-{dd}',
        //     formatter: '{hh}-{mm}-{ss}',
        // },
        // data: xAxisData.value,
    },
    // Y轴配置
    yAxis: [{
        type: 'value',
        name: accYAxisName,
        splitLine: { show: false }, // 可选：隐藏网格线
        nameTextStyle: { // 轴名称的文字样式
            color: ACC_COLOR,
            fontWeight: 'bold',
            fontSize: 14,
        },
        // 轴线样式
        axisLine: { // 轴线本身
            show: true, // 是否显示轴线
            lineStyle: { // 轴线样式
                color: ACC_COLOR, // 轴线颜色
                width: 3, // 线宽
                type: 'solid', // 线型（可选：'solid'、'dashed'、'dotted'）
                shadowColor: 'rgba(0, 0, 0, 0.1)', // 阴影颜色
                shadowBlur: 10, // 阴影模糊程度
            },
        },
        animation: true,
    },
    {
        type: 'value',
        name: pressureYAxisName,
        splitLine: { show: false }, // 可选：隐藏网格线
        nameTextStyle: { // 轴名称的文字样式
            color: PRESSURE_COLOR,
            fontWeight: 'bold',
            fontSize: 14,
        },
        // 轴线样式
        axisLine: { // 轴线本身
            show: true, // 是否显示轴线
            lineStyle: { // 轴线样式
                color: PRESSURE_COLOR, // 轴线颜色
                width: 3, // 线宽
                type: 'dotted', // 线型（可选：'solid'、'dashed'、'dotted'）
                shadowColor: 'rgba(0, 0, 0, 0.1)', // 阴影颜色
                shadowBlur: 10, // 阴影模糊程度
            },
        },
        animation: true,
    }],
    legend: {
        show: true,
        left: 100,
        formatter(name: string) {
            return name === accSerieName ? '加速度' : '压力'
        }
    },
    // 系列配置（折线图）
    series: [
        {
            name: accSerieName,
            type: 'line',
            yAxisIndex: 0, // 关联到第一个Y轴
            // smooth: true,
            lineStyle: {
                color: ACC_COLOR,
            },
            symbol: 'circle',
            symbolSize: 12,
            // areaStyle: {
            //     opacity: 0.2,
            //     color: LinearGradient(0, 0, 0, 1, [{
            //         offset: 0,
            //         color: '#FFC107',
            //     }, {
            //         offset: 1,
            //         color: '#FFE082',
            //     }]),
            // },
            emphasis: {
                focus: 'series',
            },
            data: accData.value,
        },
        {
            name: pressureSerieName,
            type: 'line',
            yAxisIndex: 1, // 关联到第二个Y轴（白银价格轴）
            // smooth: true,
            lineStyle: {
                color: PRESSURE_COLOR,
            },
            symbol: 'circle',
            symbolSize: 12,
            // areaStyle: {
            //     opacity: 0.2,
            //     color: new LinearGradient(0, 0, 0, 1, [{
            //         offset: 0,
            //         color: '#B0BEC5',
            //     }, {
            //         offset: 1,
            //         color: '#CFD8DC',
            //     }]),
            // },
            emphasis: {
                focus: 'series',
            },
            data: pressureData.value,
        },
    ],
    // 工具箱（可选）
    toolbox: {
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
        axisPointer: {
            type: 'cross',
        },
        formatter: function (params) {
            // 时:分:秒
            return `${params[0].axisValueLabel.substring(params[0].axisValueLabel.indexOf(' ') + 1)} ` +
                `${params.length >= 1 ? '加速度: ' + params[0].value[1] : ''}${params.length >= 2 ? ' 压力: ' + params[1].value[1] : ''}`;
        }
    },
    dataZoom: [{
        id: 'dataZoomId',
        name: 'dataZoomId',
        type: 'inside', // 内置型数据区域缩放组件
        start: 0,       // 数据窗口起始比例，默认从0开始
        end: 100,       // 数据窗口结束比例，默认显示所有数据（100%）
        filterMode: 'filter', // 数据过滤模式，选择'empty'则保留原数据点，但不绘制；选择'filter'则完全剔除不在窗口内的数据点
        realtime: true, // 实时响应数据窗口变化
    }],
}

let lastDataZoomEnd = 0; // 上一次数据窗口结束位置（初始为0）
const updateFrameTemplate = {
    animation: accData.value.length < props.maxFrame,
    series: [
        {
            name: '加速度随时间变化曲线',
            data: accData.value,
        },
        {
            name: '压力随时间变化曲线',
            data: pressureData.value,
        },
    ],
    // dataZoom: [{
    //     id: 'dataZoomId',
    //     name: 'dataZoomId',
    //     end: lastDataZoomEnd / accData.value.length * 100, // 转换为百分比形式
    // }],
}

const updateVisualMapTemplate = {
    visualMap: {}
}

const updateMarkAreaTemplate = {
    series: [
        {
            name: accSerieName,
            markArea: undefined,
        },
        {
            name: pressureSerieName,
            markArea: undefined,
        }
    ]
}

const saveCb = (event: BeforeUnloadEvent) => {
    emit('save', {
        acc: oldData.acc.concat(accData.value.map(v => v.value[1])),
        pressure: oldData.pressure.concat(pressureData.value.map(v => v.value[1])),
        date: oldData.date.map(d => d.getTime()).concat(accData.value.map(v => v.name.getTime()))
    })
    // 可选：返回一个字符串作为提示消息，浏览器将显示一个确认对话框
    event.returnValue = `过往数据(共${props.maxOldFrame}条)已被记录`;
    event.preventDefault();
};

onMounted(() => {
    window.addEventListener('beforeunload', saveCb);
})

onUnmounted(() => {
    window.removeEventListener('beforeunload', saveCb);
})

// let actived = true;
// onActivated(() => {
//     actived = true;
// })
// onDeactivated(() => {
//     actived = false;
// })


</script>