import * as echarts from 'echarts/core';
import {
    BarChart,
    LineChart,
    PieChart,
    GraphChart,
} from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    // 数据集组件
    DatasetComponent,
    // 内置数据转换器组件 (filter, sort)
    TransformComponent,
    DataZoomComponent,
    MarkAreaComponent,
    ToolboxComponent,
    LegendComponent,
    VisualMapComponent
} from 'echarts/components';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import type {
    // 系列类型的定义后缀都为 SeriesOption
    BarSeriesOption as _BarSeriesOption,
    PieSeriesOption as _PieSeriesOption,
    LineSeriesOption as _LineSeriesOption,
    GraphSeriesOption as _GraphSeriesOption,
} from 'echarts/charts';

import type {
    // 组件类型的定义后缀都为 ComponentOption
    TitleComponentOption,
    TooltipComponentOption,
    GridComponentOption,
    DatasetComponentOption,
} from 'echarts/components';
import {
    type ComposeOption,
    type EChartsType as _EChartsType,
    init as _init,
    graphic as _graphic,
    type ECharts as _ECharts,
} from 'echarts/core';


// import { LinearGradient } from 'echarts'
export const LinearGradient: typeof echarts.graphic.LinearGradient = echarts.graphic.LinearGradient.bind(echarts.graphic);
export const init = _init;
// export const graphic = _graphic;
export interface ECharts extends _ECharts { };
export type EChartsType = _EChartsType;
export type BarSeriesOption = _BarSeriesOption;
export type PieSeriesOption = _PieSeriesOption;
export type LineSeriesOption = _LineSeriesOption;
export type GraphSeriesOption = _GraphSeriesOption;

// 通过 ComposeOption 来组合出一个只有必须组件和图表的 Option 类型
export type ECOption = ComposeOption<
    | BarSeriesOption
    | PieSeriesOption
    | LineSeriesOption
    | GraphSeriesOption
    | TitleComponentOption
    | TooltipComponentOption
    | GridComponentOption
    | DatasetComponentOption
>;


// 注册必须的组件
echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    TransformComponent,
    DataZoomComponent,
    MarkAreaComponent,
    ToolboxComponent,
    LegendComponent,
    VisualMapComponent,
    BarChart,
    GraphChart,
    LineChart,
    LabelLayout,
    UniversalTransition,
    CanvasRenderer,
    PieChart
]);


export default echarts;

