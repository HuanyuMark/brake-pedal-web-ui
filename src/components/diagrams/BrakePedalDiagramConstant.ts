import { readonly } from "vue";

export const PRESSURE_COLOR = 'black';
export const ACC_COLOR = 'blue';
export const markLineDep = (() => {
    const params = new URLSearchParams(window.location.search);
    const acc = {
        maxMin: parseFloat(params.get('accMin')) || 33,
        maxMid: parseFloat(params.get('accMid')) || 66
    }
    const pressure = {
        maxMin: parseFloat(params.get('psMin')) || 33,
        maxMid: parseFloat(params.get('psMid')) || 66
    }
    return readonly({ acc, pressure });
})()

export const unitDep = (() => {
    const params = new URLSearchParams(window.location.search);
    return {
        acc: params.get('accU') || 'm/s^2',
        pressure: params.get('psU') || 'N',
    }
})()

export interface OldFrameDateLike {
    acc: number[],
    pressure: number[],
    date: number[]
}

export interface OldFrameDate {
    acc: number[],
    pressure: number[],
    date: Date[]
}

