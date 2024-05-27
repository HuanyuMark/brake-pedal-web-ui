// import Reflect from "core-js/fn/reflect";

export function isHTMLElement(obj: any) {
    if (!obj) return false;
    if (obj === 'HTMLElement'
        || obj.type === 'HTMLElement'
        || typeof obj.innerHTML === 'string'
        || typeof obj.outerHTML === 'string')
        return true
    return false
}

export function findHTMLElement(obj: any) {
    if (!obj) {
        console.warn('the source of function findHTMLElement is without HTMLElements')
        return undefined
    } else {
        if (isHTMLElement(obj)) { console.log(obj); return obj };
        for (let property in obj) {
            // console.log(`${obj}[${property}]`,obj[property]);
            if (obj[property] === null || obj[property] === undefined
                || obj[property] instanceof Array || obj[property] instanceof Boolean
                || typeof obj[property] === 'boolean' || obj[property] instanceof Number
                || typeof obj[property] === 'number' || obj[property] instanceof String
                || typeof obj[property] === 'string') {
                // console.log(`${obj}[${property}]`, obj,property,obj[property]);
                return
            }
            // console.log(`pass: ${obj}[${property}]`,obj[property]);
            if (isHTMLElement(obj[property])) {/*  console.log(obj[property]); */ return obj[property] };
            findHTMLElement(obj[property])
        }
    }
}


/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */

export function looseEqual(a: any, b: any): boolean {
    if (a === b) return true   //参数a恒等于参数b，则直接返回true
    const isObjectA = isObject(a)
    const isObjectB = isObject(b)
    if (isObjectA && isObjectB) { //如果a,b不为空且都是对象
        try {
            const isArrayA = Array.isArray(a)
            const isArrayB = Array.isArray(b)
            if (isArrayA && isArrayB) {
                //当a,b是数组时，先判断length长度是否相同，不相同则可以结束比较
                return a.length === b.length && a.every((e, i) => {
                    return looseEqual(e, b[i])  //递归判断两个数组中的每一项
                })
            } else if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime()
            } else if (!isArrayA && !isArrayB) {
                const keysA = Object.keys(a)
                const keysB = Object.keys(b)
                return keysA.length === keysB.length && keysA.every(key => {
                    return looseEqual(a[key], b[key])
                })
            } else {
                /* istanbul ignore next */
                return false
            }
        } catch (e) {
            /* istanbul ignore next */
            return false
        }
    } else if (!isObjectA && !isObjectB) {
        return String(a) === String(b)
    } else {
        return false
    }
}

export function isObject(a: any) {
    return a === null || typeof a === 'object'
}

export function isArray(a: any) {
    return Array.isArray(a)
}

export function clone<T>(source: T, deep = true): T {
    if (source === null) return source;
    if (typeof source === 'object') {
        if (!deep) { return source; }
        let copyObj: any;
        if (Array.isArray(source))
            copyObj = []
        else
            copyObj = {}

        Reflect.ownKeys(source as unknown as object).forEach(key => {
            const value: any = Reflect.get(source as unknown as object, key, source);
            if (isObject(value))
                copyObj[key] = clone(value);
            else
                copyObj[key] = value;
        })
        return copyObj
    }
    else
        return source
}

export interface AntiShakeLocker<T> {
    lock: () => void;
    unlock: () => void,
    decoratedFn: T & {
        lock: () => void;
        unlock: () => void,
    }
}

/**
 * 
 * @param fn decarated function
 * @returns 
 */
export function freeDebounce<T extends ((...param: any[]) => void)>(fn: T): AntiShakeLocker<T> {
    let isLocked = false;
    const decoratedFn = ((...param: any[]) => {
        if (isLocked) { return false; }
        return fn(...param);
    }) as unknown as T & {
        lock: () => void;
        unlock: () => void,
    };
    decoratedFn.lock = () => isLocked = true;
    decoratedFn.unlock = () => isLocked = false;
    return {
        decoratedFn,
        lock: decoratedFn.lock,
        unlock: decoratedFn.unlock,
    };
}


/**
 * @description Set the minimum interval between function fn executions
 * @param {function} fn 
 * @param {number} interval 
 * @returns {function} anti-shake function
 */
export function debounce<T extends ((...param: any[]) => any)>(fn: T, interval: number = 1): T {
    if (typeof fn !== 'function' || typeof interval !== 'number') {
        throw new TypeError('[antiShake]: fn: function   interval: number')
    }

    let active = false;
    let lastValue: ReturnType<T> | undefined = undefined; // 内存泄漏!
    return ((...params: any[]) => {
        if (!active) {
            active = true;
            setTimeout(() => active = false, interval);
            lastValue = fn(...params)
            return lastValue;
        }
        return lastValue;
    }) as unknown as T;
}

export const DELAY_SYMBOL = Symbol('delay');

export type SecondArgsOfFunc<F> = F extends (...args: infer I) => any
    ? I extends any ? I extends [any, ...infer O]
    ? O
    : never
    : never
    : never;

export function delayExecuteAsync<T extends (((...param: [AbortSignal, ...any]) => Promise<any>))>
    (fn: T, interval: number): (((...params: SecondArgsOfFunc<T>) => ReturnType<T>)) {
    // @ts-ignore
    if (fn.__proto__[Symbol.toStringTag] !== (async () => { }).__proto__[Symbol.toStringTag]/*'AsyncFunction'*/) {
        throw new TypeError('[debounceAsync] fn should return a Promise');
    }
    let controller: AbortController | null = null;
    let reject: ((reason: symbol) => any) | null = null;
    let timer: any;
    return ((...params: SecondArgsOfFunc<T>) => {
        if (controller) {
            controller.abort();
        }
        if (reject) {
            reject(DELAY_SYMBOL);
        }
        return new Promise((resolve, rej) => {
            controller = new AbortController();
            reject = (reason) => {
                clearTimeout(timer);
                rej(reason)
            };
            timer = setTimeout(async () => {
                const res: ReturnType<T> = await fn((controller as AbortController).signal, ...params);
                controller = null;
                reject = null;
                resolve(res);
            }, interval);
        }) as ReturnType<T>
    });
}

export type DelayExecuteor<T extends ((...param: any[]) => any)> = ((...param: Parameters<T>) => Promise<ReturnType<T>>) & {
    original: T,
    clear: () => void
}

export function makeDelayExecuteor<T extends ((...param: any[]) => any)>(fn: T, delayTime: number): DelayExecuteor<T> {
    let timer: any;
    const delayExecuteor = ((...params: any[]) => {
        return new Promise((resolve, reject) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    const res = fn(...params);
                    resolve(res);
                } catch (error) {
                    reject(error);
                }
            }, delayTime)
        })
    }) as unknown as DelayExecuteor<T>;
    delayExecuteor.original = fn;
    delayExecuteor.clear = () => clearTimeout(timer);
    return delayExecuteor;
}

/**
 * @param {Array} source The array to be sorted
 * @param {Function} conditionFn will be passed to elements A and B , and it should return boolean, if return true, A is in front of B 
 * @return {Array} the Ordered Array
 */
export function mergeSort<T>(source: Array<T>, conditionFn: (arg1: T, arg2: T) => boolean): Array<T> {
    if (Array.isArray(source)) {
        if (typeof conditionFn === 'function') {
            // console.log(mergeSort_(source))
            return mergeSort_(source)
        } else
            throw new TypeError('The conditionFn must be a function return boolean')
    } else {
        throw new TypeError('The source data to be sorted must be a Array')
    }

    /**
     * @param {Array<T>} source
     * @return {Array<T>} Ordered array
     */
    function mergeSort_(source: Array<T>): Array<T> {
        // 当左下标小于右下标时, 说明已经划分到最小的元素 => 只有一个元素的数组
        if (source.length === 1) return source
        const mid = Math.floor(source.length / 2)

        // 划分左 右 两个无序数组 source.slice就是 divide 划分函数
        const leftArr = source.slice(0, mid)
        const rightArr = source.slice(mid)

        // 两组有序数组
        const leftArea = mergeSort_(leftArr)
        const rightArea = mergeSort_(rightArr)
        // console.log(leftArr, leftArea)
        // console.log(rightArr, rightArea)

        return merge(leftArea, rightArea)
    }

    // 划分函数已经有了 就是 source.slice
    /**
     * @param {Array} source the array to be divided
     * @param {Number} start
     * @param {Number} end
     * @return {Array} 
     *     
    function divide(source, start = 0, end = source.length) {
        return source.slice(start, end)
    }
     */

    /**
     * @param {Array} leftArr 
     * @param {Array} rightArr 
     * @returns {Array} the Ordered Array
     */
    function merge(leftArr: Array<T>, rightArr: Array<T>): Array<T> {
        let leftPointer = 0
        let rightPointer = 0
        // const result = [] Array.from({ length: leftArr.length + rightArr.length })
        let result: Array<T> = []

        // 排序
        // 若为真, 则 A 排在 B前面, 假定条件函数为 (a,b)=> a < b
        // [5,7,9] [3,4,10,12]  [5,7,7] [1,2,3,4,7,7,8,8] 
        // 0 0
        // r++
        // 0 1
        // r++
        // 0 2 
        // l++
        // 1 2
        // l++
        // 2 2
        // l++
        // let index = 0
        // 必须初始化,否则下面的对于这两个判断条件的赋值语句可能不会生效,导致有一个变量值为undefined, 即为假, 会干扰 合并剩余元素的步骤
        let condition_1 = true
        let condition_2 = true
        do {
            if (conditionFn(leftArr[leftPointer], rightArr[rightPointer])) {
                // result[index] = leftArr[leftPointer]
                result.push(leftArr[leftPointer])
                leftPointer++
                condition_1 = leftPointer < leftArr.length
            } else {
                // result[index] = rightPointer[rightPointer]
                result.push(rightArr[rightPointer])
                rightPointer++
                condition_2 = rightPointer < rightArr.length
            }
            // index++
        } while (condition_1 && condition_2)

        // 将还未编入结果数组的元素都合并入结果数组
        // 左边的数组比右边的数组长,那么左边的元素必定没有全部合并入结果数组
        if (condition_1) {
            result = result.concat(leftArr.slice(leftPointer))
        } else if (condition_2) {
            result = result.concat(rightArr.slice(rightPointer))
        }

        return result
    }
}

export const distinctArray = <T = any>(arr: T[]) => {
    const set = new Set<T>(arr);
    const res: T[] = [];
    set.forEach(el => res.push(el));
    return res;
}

export interface GroupResult<N, M> {
    name: N,
    members: M[]
}
/**
 * 分组函数
 * @param arr 需要分组的数组
 * @param groupGenerator 生成组名的生成器
 */
export const groupBy = <MemberType, GroupName>(arr: MemberType[], groupGenerator: (el: MemberType) => GroupName): GroupResult<GroupName, MemberType>[] => {
    const groupMap = new Map<GroupName, MemberType[]>();
    arr.forEach(el => {
        const groupName = groupGenerator(el);
        let group = groupMap.get(groupName);
        if (!group) {
            group = [];
            groupMap.set(groupName, group);
        }
        group.push(el);
    })
    const res: GroupResult<GroupName, MemberType>[] = [];
    groupMap.forEach((members, name) => {
        res.push({
            name,
            members
        })
    })
    return res;
}

/* 
// 给js原生类原型追加属性和方法, Vue 搭配element plus会报错,类似于
// [Vue warn] prop invalid: prop 'getAllKeys'
// 接受了一个无效的参数,其应该为一个function

// 以下的getAllKeys方法,原生有实现方式
Object.prototype.getAllKeys = function () {
    const keys = []
    for (let key in this)
        if (this.hasOwnProperty(key))
            keys.push(key)
    return keys
} 

Object.prototype.test = 'ok'
let obj111 = { a: 1, b: 2 c:{d:1,e:2}}
console.log(Object.keys(obj111)) // ['a','b'] 

Object.keys(Object instance) //可以将obj实例,即 对象 的所有第一层键名
*/
