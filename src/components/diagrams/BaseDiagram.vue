<template>
    <div ref="containerRef" class="char-diagram"></div>
</template>

<script lang="ts" setup generic="Opt extends ECOption">
import { init as initChar, ECOption, EChartsType } from './echarts';
import { shallowRef, watch, onMounted, onActivated, onUnmounted, onDeactivated } from 'vue'
import { makeDelayExecuteor } from '../../support/jsExpend';
export interface HighlightEvent {

}

export interface BaseDiagramEvent {
    "highlight": HighlightEvent
}

export interface BaseDiagramEmit {
    (e: 'echarMounted', instance: EChartsType): void;
}

export interface BaseDiagramInstance {
    echart: () => EChartsType,
    container: () => HTMLBaseElement,
    init: () => void,
}

export interface BaseDiagramProps<Opt> {
    option: Opt,
    event?: {
        [K in keyof BaseDiagramEvent]: (this: EChartsType, evt: BaseDiagramEvent[K]) => void;
    }
}

const timers: {
    interval: Record<string, number>,
    timeout: Record<string, number>
} & Record<string, Record<string, number>> = { interval: {}, timeout: {} };

const timersAutoId = {
    interval: <any[]>[],
    timeout: <any[]>[]
}

const timerCallback = {
    interval: <({ fn: () => void, interval: number })[]>[],
    timeout: <(() => void)[]>[],
}

const props = defineProps<BaseDiagramProps<Opt>>();

const emit = defineEmits<BaseDiagramEmit>();

const containerRef = shallowRef<HTMLBaseElement>();

let echartInstance: EChartsType | null = null;
let observer: ResizeObserver | null = null/* = new ResizeObserver(observerCallback);
    observer.observe(fltWindowDom, {
        box: 'border-box'
    }); */
const handleResize = () => {
    echartInstance?.resize();
}

const bindEvent = () => {
    clear();
    containerRef.value?.addEventListener('resize', handleResize);
}

const bindTimerCallback = () => {
    timerCallback.interval.forEach(({ fn, interval }) => { timersAutoId.interval.push(setInterval(fn, interval)) });
    timerCallback.timeout.forEach(cb => { timersAutoId.timeout.push(setTimeout(cb)) });
}

const unbindTimerCallback = () => {
    timersAutoId.interval.forEach(clearInterval);
    timersAutoId.timeout.forEach(clearTimeout);
}

const clear = () => {
    containerRef.value?.removeEventListener('resize', handleResize);
    echartInstance && echartInstance.clear();
    observer && observer.disconnect();
    Object.values(timers.interval).forEach(clearInterval);
    Object.values(timers.timeout).forEach(clearTimeout);
    echartInstance = null;
}

watch(() => props.option, (newOption) => {
    console.log('props.option', newOption);
    echartInstance?.setOption(newOption);
})

const init = () => {
    setTimeout(() => {
        if (!containerRef.value) {
            console.error('cannot init echart, container dom is nonexistent', containerRef.value);
            return;
        }
        // console.log('echart mounting...');
        bindEvent();
        unbindTimerCallback();
        bindTimerCallback();
        const containerDom = containerRef.value;
        observer = new ResizeObserver(() => {
            const reac = containerDom.getBoundingClientRect();
            if (reac.width && reac.height) {
                echartInstance = initChar(containerDom);
                console.log('props.option', props.option);
                echartInstance.setOption(props.option);
                emit('echarMounted', echartInstance);
                observer?.disconnect();
                observer = null;
                observer = new ResizeObserver(makeDelayExecuteor(() => {
                    echartInstance?.resize();
                }, 5))
                observer.observe(containerDom, {
                    box: 'border-box'
                });
            }
        });
        observer.observe(containerDom, {
            box: 'border-box'
        });
    })
}



onMounted(init);
onActivated(init);
onUnmounted(clear);
onDeactivated(() => {
    clear();
    unbindTimerCallback();
});

defineExpose(<BaseDiagramInstance>{
    echart: () => echartInstance,
    container: () => containerRef.value,
    init: () => init(),
})

</script>

<style scoped>
.char-diagram {
    width: 100%;
    height: inherit;
}
</style>

<style></style>

