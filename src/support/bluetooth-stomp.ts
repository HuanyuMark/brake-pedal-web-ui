import { Client, StompConfig } from '@stomp/stompjs'
import { BtInfo, IBtInfo, IBrakePedalStateFrame } from './bluetooth';
let client: Client;
const openWs = () => {
    if (client) {
        client.deactivate();
    }
    const config: StompConfig = {
        //@ts-ignore
        brokerURL: `ws://${import.meta.env.VITE_BT_SERVER_HOST}:${import.meta.env.VITE_BT_SERVER_PORT}/${import.meta.env.VITE_BT_SERVER_ENDPOINT}`
    }
    client = new Client(config);
    client.activate();
}

export const startScanDevice = () => {
    if (!client) {
        openWs();
    }
    client.publish({
        destination: '/bt/ops/start-scan'
    })
    let receptor_: (infos: BtInfo[]) => void;
    client.subscribe('/bt/ops/scan-list', (message) => {
        if (!receptor_) {
            return;
        }
        const infos: IBtInfo[] = JSON.parse(message.body);
        receptor_(infos.map(info => new BtInfo(info)));
    })
    return {
        whenScaned: (receptor: typeof receptor_) => {
            receptor_ = receptor;
        }
    }
}

export const stopScanDevice = () => {
    if (client) {
        client.publish({
            destination: '/bt/ops/stop-scan'
        });
    }
}

export const pair = (btInfo: IBtInfo) => {
    if (!client) { return; }
    client.publish({
        destination: '/pair'
    });
    let frameHandler: (frame: IBrakePedalStateFrame) => void;
    client.subscribe('/bt/data', msg => {
        if (!frameHandler) {
            return;
        }
        frameHandler(JSON.parse(msg.body));
    })
    return {
        handleFrame: (handler: typeof frameHandler) => {
            frameHandler = handler;
        }
    }
}