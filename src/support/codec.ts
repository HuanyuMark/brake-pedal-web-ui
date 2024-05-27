
class BluetoothCodec {
    private readonly ch: BluetoothRemoteGATTCharacteristic;

    // private readonly readCbs = 

    constructor(ch: BluetoothRemoteGATTCharacteristic) {
        this.ch = ch;
        ch.startNotifications().then(res => {
            console.log('start listening');
        }).catch(err => {
            console.error(err);
        })
        ch.addEventListener(
            'characteristicvaluechanged', e => {
                //监听设备端的操作 获取到值之后再解析
                console.log('e.target.value:', BluetoothCodec.ab2hex(ch.value.buffer));
            }
        );
        ch.service.device.addEventListener('gattserverdisconnected', () => {
            console.log(`设备: ${ch.service.device.name} 已经断开连接`);
        })
    }

    private static string2buffer(str: string) {
        if (!str) return;
        const length = str.length;
        let index = 0;
        const array:string[] = [];
        while (index < length) {
            array.push(str.substring(index, index + 2));
            index = index + 2;
        }
        const val = array.join(",");
        // 将16进制转化为ArrayBuffer
        return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
            return parseInt(h, 16);
        })).buffer
    }
    private static ab2hex(buffer: ArrayBuffer) {
        const hexArr:string[] = Array.prototype.map.call(
            new Uint8Array(buffer),
            function (bit) {
                return ('00' + bit.toString(16)).slice(-2);
            }
        )
        return hexArr.join('');
    }

    onRead() {

    }
}