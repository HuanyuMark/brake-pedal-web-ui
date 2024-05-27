import { io, Socket } from 'socket.io-client'
import { IBrakePedalStateFrame, BtInfo, IBtInfo, BtPairResult } from './bluetooth';

let socket: Socket;
let receptor_: (infos: BtInfo[]) => void;
let frameHandler: (frame: IBrakePedalStateFrame) => void;

const openWs = () => {
    if (socket) {
        socket.disconnect();
    }
    console.log('openWs');
    //@ts-ignore
    socket = io(`http://${import.meta.env.VITE_BT_SERVER_HOST}:${import.meta.env.VITE_BT_SERVER_WS_PORT}`, {
        transports: ['websocket', 'polling'],
        // retries: 5,
    });
    socket.on('connect', () => {
        socket.on('/bt/ops/scan/result', (infos: IBtInfo[]) => {
            if (!receptor_) {
                return;
            }
            receptor_(infos.map(info => new BtInfo(info)));
        })
        socket.on('/bt/data', (frame: IBrakePedalStateFrame) => {
            if (!frameHandler) {
                return;
            }
            frameHandler(frame);
        })
    })
}

export const startScanDevice = () => {
    if (!socket) {
        openWs();
    }
    console.log('emit /bt/ops/start-scan');
    socket.emit('/bt/ops/start-scan');
    return {
        whenScaned: (receptor: typeof receptor_) => {
            receptor_ = receptor;
        }
    }
}

export const stopScanDevice = () => {
    if (socket) {
        socket.emit('/bt/ops/stop-scan');
    }
}


export interface FrameHandlerRegister {
    handleFrame: (handler: typeof frameHandler) => void;
}

export const pair = (btInfo: IBtInfo): Promise<FrameHandlerRegister> => {
    if (!socket) { return; }
    socket.emit('/bt/ops/pair', btInfo);
    return new Promise((res, rej) => {
        socket.once('/bt/ops/pair/result', (result: BtPairResult) => {
            if (result.success) {
                res({
                    handleFrame: (handler: typeof frameHandler) => {
                        frameHandler = handler;
                    }
                });
            } else {
                rej(result.cause);
            }
        })
    })
}

export const syncState = () => {
    if (!socket) {
        openWs();
    }
    let pairedDeviceReceptor: ((info: BtInfo) => void) | null = null;
    socket.emit('/bt/ops/sync');
    socket.once('/bt/ops/paired', (info: IBtInfo) => {
        if (pairedDeviceReceptor) {
            pairedDeviceReceptor(new BtInfo(info))
        }
    })
    return {
        whenScaned: (receptor: typeof receptor_) => {
            receptor_ = receptor;
        },
        handleFrame: (handler: typeof frameHandler) => {
            frameHandler = handler;
        },
        whenPaired: (receptor: typeof pairedDeviceReceptor) => {
            pairedDeviceReceptor = receptor;
        }
    }
}