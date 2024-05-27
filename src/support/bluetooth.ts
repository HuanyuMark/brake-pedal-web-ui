// import {
//     startScanDevice as startScanDeviceStomp,
//     stopScanDevice as stopScanDeviceStomp,
//     pair as pairStomp
// } from './bluetooth-stomp'
import {
    startScanDevice as startScanDeviceSocketIo,
    stopScanDevice as stopScanDeviceSocketIo,
    pair as pairSocketIo,
    syncState as syncStateSocketIo
} from './bluetooth-socket.io'


export interface IBtInfo {
    get name(): string | undefined
    get address(): string
}

export class BtInfo implements IBtInfo {
    private readonly base: IBtInfo;
    get name() {
        return this.base.name;
    };
    get address() {
        return this.base.address;
    };
    readonly key: string;
    constructor(info: IBtInfo) {
        this.base = info;
        if (info.name) {
            this.key = `${info.name}(${info.address})`;
        } else {
            this.key = info.address;
        }
    }
}

export interface IBrakePedalStateFrame {
    acc: number;
    pressure: number;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
}

export interface BtPairResult {
    success: boolean,
    cause?: string | null
}

const envDecorate = <F>(f1: F, f2: F) => {
    //@ts-ignore
    console.log('import.meta.env.VITE_BT_SERBER_WS_DEP', import.meta.env.VITE_BT_SERBER_WS_DEP);
    //@ts-ignore
    if (import.meta.env.VITE_BT_SERBER_WS_DEP === 'socket.io') {
        return f1;
    } else {
        return f2;
    }
}

// export const startScanDevice = envDecorate(startScanDeviceSocketIo, startScanDeviceStomp);
export const startScanDevice = startScanDeviceSocketIo;

export const stopScanDevice = stopScanDeviceSocketIo;

export const pair = pairSocketIo;

export const syncState = syncStateSocketIo;