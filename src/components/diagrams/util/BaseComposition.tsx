import { Component, onActivated, onDeactivated, onMounted, onUnmounted, shallowRef, watch } from "vue";
import { init, ECOption, EChartsType } from '@/components/Diagram/echarts';

export interface BaseDiagramProps {
    option: ECOption
}

const useBaseDiagram = (): Component<BaseDiagramProps> => {
    const componentDefination = {
        name: 'BaseDiagram',
        echartInstance: null as (EChartsType | null),
        container: null as (HTMLBaseElement | null),
        setup() {
            const props = defineProps<BaseDiagramProps>();

            const containerRef = shallowRef<HTMLBaseElement>();

            let echartInstance: EChartsType;

            const handleResize = () => {
                echartInstance.resize();
            }

            const bindEvent = () => {
                containerRef.value?.addEventListener('resize', handleResize);
            }

            const clear = () => {
                containerRef.value?.removeEventListener('resize', handleResize);
            }

            watch(() => props.option, (newOption) => {
                echartInstance.setOption(newOption);
            })

            onMounted(() => {
                if (!containerRef.value) {
                    console.error(containerRef.value);
                    return;
                }
                const containerDom = containerRef.value;
                echartInstance = init(containerDom);
                echartInstance.setOption(props.option);

                componentDefination.container = containerDom;
                componentDefination.echartInstance = echartInstance;
                bindEvent();
            })
            onActivated(bindEvent);
            onUnmounted(clear)
            onDeactivated(clear)

            defineExpose({
                echart: () => echartInstance
            })

            return () => (<div ref={containerRef} class="base-diagram"></div>);
        },
    }
    return componentDefination;
}