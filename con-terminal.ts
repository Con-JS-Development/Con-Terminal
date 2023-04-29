import { system } from "@minecraft/server";

const AsyncFunctionConstructor = (async function () {}).constructor;
const GeneratorFunctionConstructor = (function* (){}).constructor;
const AsyncGeneratorFunctionConstructor = (async function *(){}).constructor;
const runInterval = system.runInterval.bind(system);
const runTimeout = system.runTimeout.bind(system);
const clearRun = system.clearRun.bind(system);
const nativeFunction = "{\n    [native code]\n}";
const safePrototypes = [
    Object.prototype,
    Array.prototype,
    Map.prototype,
    Set.prototype,
    Function.prototype,
    AsyncFunctionConstructor.prototype,
    GeneratorFunctionConstructor.prototype,
    AsyncGeneratorFunctionConstructor.prototype
];
const MinecraftModules = [
    {module_name: "@minecraft/server", tag: "mc"},
    {module_name: "@minecraft/server-ui", tag: "ui"},
    {module_name: "@minecraft/server-gametest", tag: "gametest"},
    {module_name: "@minecraft/server-net", tag: "net"},
    {module_name: "@minecraft/server-admin", tag: "admin"},
    {module_name: "@minecraft/server-editor", tag: "editor"},
    {module_name: "@minecraft/server-editor-bindings", tag: "bindings"}
];
enum OutputType{
    SyntaxError,
    Error,
    Successfull
}
enum LogTypes{
    log,
    error,
    warn
}
const setInterval = (callBack: Function, interval = 0, ...params: any[])=>runInterval(()=>callBack(...params),interval);
const setTimeout = (callBack: Function, interval = 0, ...params: any[])=>runTimeout(()=>callBack(...params),interval);
function consoleLike(this: any, type: LogTypes,...texts: any[]): void{
    console.warn(`[Terminal-${LogTypes[type]}]: `, ...texts.map(a=>getView[typeof a](ViewStyle.Short, a)));
}
function formatView(type: OutputType, object: any): string{
    return getView[typeof object](ViewStyle.Full, object);
}
export async function TerminalInput<s>(source: s, message: string, o:(this: s, type: LogTypes,...params: any[])=>void = consoleLike){
    const a = await RunCode(message, true, {console:{log:o.bind(source,LogTypes.log),warn:o.bind(source,LogTypes.warn),error:o.bind(source,LogTypes.error)},print:o.bind(source,LogTypes.log), self:source, setTimeout, setInterval, clearInterval:clearRun, clearTimeout:clearRun});
    const multicommand = a.multicommand;
    if(a.syntaxError) return {type: OutputType.SyntaxError, value: a.syntaxError, formatView: formatView(OutputType.SyntaxError, a.syntaxError),multicommand};
    try {
        const output = await a.promise;
        return {type: OutputType.Successfull, value: output, formatView: formatView(OutputType.Successfull, output),multicommand};
    } catch (error) {
        console.warn("It was handled xd, but after the promise returns");
        return {type: OutputType.Error, value: error, formatView: formatView(OutputType.Error, error),multicommand};
    }
}
async function RunCode(code: string, useModules = true, ...scopes: any[]): Promise<{syntaxError?:any, promise?: Promise<any | never>, multicommand: boolean}> {
    let func, output = {syntaxError: undefined, promise: undefined, multicommand: false};
    const modules = useModules?(await BuildAPIScope(...MinecraftModules)):[];
    try {
        //@ts-ignore
        func = BuildNewFunction(this as any, code,...modules,...scopes);
    } catch (error) {
        output.syntaxError = error as any;
        return output;
    }
    output.multicommand = func.multicommand??false;
    output.promise = func();
    return output;
}
async function BuildAPIScope(...modules: {module_name:string, tag:string}[]){
    let promises: Promise<any>[] = [];
    modules.forEach(m=>promises.push(import(m.module_name).catch(()=>({}))));
    const dlls = await Promise.all(promises);
    return dlls.map((m,i)=>({[modules[i].tag]: m}));
}
function BuildNewFunction(thisArg: any = globalThis, code: string, ...scopes: {}[]){
    let scope: any = {}, func;
    for(const s of scopes) Object.assign(scope,s);
    let keys = Object.getOwnPropertyNames(scope);
    try {
        if(code.endsWith(";")) code = code.substring(0,code.length - 1);
        func = AsyncFunctionConstructor.apply(AsyncFunctionConstructor,[...keys,"return (" + code + ")"]);
    } catch (error) {
        func = AsyncFunctionConstructor.apply(AsyncFunctionConstructor,[...keys,code]);
        func.multicommand = true;
    }
    const a = Function.prototype.bind.apply(func,[thisArg,...keys.map(k=>scope[k])]);
    a.multicommand = !!func.multicommand;
    return a;
}

enum ViewStyle{
    Primitive,
    Short,
    Full
}

const getView: {[key: string]:(style: ViewStyle, n: any)=>string} = {
    "object"(style: ViewStyle, any: any){
        if(any === null) return "§7§onull";
        if (style === ViewStyle.Primitive){
            const typeOf = getTypeOfObject(any);
            return `§7${(typeOf == "Object" || typeOf == '')?"":typeOf + " "}{...}`;
        }
        else if (style === ViewStyle.Short){
            const names = Object.getOwnPropertyNames(any), symbols = Object.getOwnPropertySymbols(any);
            //@ts-ignore
            const keys = names.map(k=>`§7${k}§r§7: ${getView[typeof any[k]](ViewStyle.Primitive, any[k])}§r`).concat(symbols.map(s=>`§r${getView["symbol"](ViewStyle.Primitive,s)}§r§7: ${getView[typeof any[s]](ViewStyle.Primitive,any[s])}`));
            const realKeys = keys.slice(0,5), typeOf = getTypeOfObject(any);
            return `§7${(typeOf == "Object" || typeOf == '')?"":typeOf + " "}{${realKeys.join("§7, ")}${keys.length>5?"§r§7, ...":"§r§7"}}`;
        }
        else {
            return getView["object"](ViewStyle.Short, any) + "\n" + buildCompoudView([],any,any).join('\n');
        }
    },
    "function"(n: ViewStyle, any: Function){
        if(n === ViewStyle.Short){
            const n = any.toString()??"", ctor = Object.getPrototypeOf(any).constructor;
            if(n.startsWith('class')){
                return `§5§oclass §r§3${any.name}`
            }else{
                return `§5§o${(ctor == AsyncFunctionConstructor?"async ƒ ":(ctor == GeneratorFunctionConstructor?"ƒ * ":(ctor == AsyncGeneratorFunctionConstructor?"async ƒ * ":"ƒ ")))}§r§g${any.name}§7(${(n.match(/(?<=(^[^\(]+\()|\()(.*)(?=(\)([ ]+|)\{([^]+|)\}$)|(\)(([ ]+|)(\=\>)([ ]+|))))/)??["error"])[0].replace(/  +/g," ")})`;
            }
        }
        else if (n === ViewStyle.Primitive) return "§5§oƒ§r";
        else return  getView["object"](ViewStyle.Short, any) + "\n" + buildCompoudView([],any,any,"  ",true).join('\n');
    },
    "number"(n: ViewStyle, any: number){return `§3${any.toString()}§r`},
    "bigint"(n: ViewStyle, any: bigint){return `§3${any.toString()}§r`},
    "boolean"(n: ViewStyle, any: boolean){return `§3${any.toString()}§r`},
    "symbol"(n: ViewStyle, any: symbol){return `§7Symbol(${any.description})§r`},
    "undefined"(){return "§7§oundefined§r"},
    "string"(n: ViewStyle, any: string){ 
        if(n === ViewStyle.Full) return `§3"${any}"§r`;
        else if(n === ViewStyle.Short) return `§3"${any.split('\n')[0]}"§r`;
        else {
            const v = any.split('\n')[0];
            return `§3"${v.length>20?(v.substring(0,20)+"..."):v}"§r`;
        }
    }
};
function buildCompoudView(array: string[], base: any, object: any, offSet = "  ", func = false, deepth = 1){
    const off = offSet.repeat(deepth);
    const prototype = Object.getPrototypeOf(object);
    const descriptors = Object.getOwnPropertyDescriptors(object);
    for (const key of [...Object.getOwnPropertyNames(descriptors),...Object.getOwnPropertySymbols(descriptors)]){
        const {value,set,get} = descriptors[key as string];
        if(value){
            array.push(`${off}§r${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §r${getView[typeof value](ViewStyle.Short,value)}§r`);
        }else{
            if(get != undefined){
                const v = get.call(base);
                array.push(`${off}§r§7get§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §r${getView[typeof v](ViewStyle.Short,v)}§r`);
            }
            if(set != undefined) array.push(`${off}§r§7set§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: (...)§r`);
        }
    }
    if(func) array.push(`${off}§7[[Native Function]]: §7${getView["boolean"](ViewStyle.Primitive, object.toString().endsWith(nativeFunction))}§r`);
    if(prototype == null) return array;
    const typOf = getTypeOfObject(prototype);
    array.push(`${off}§7[[Prototype]]: ${(typOf==""?"Object":typOf)}§r`);
    if(!safePrototypes.includes(prototype)) buildCompoudView(array, base, prototype, offSet, typeof prototype === 'function', deepth + 1);
    return array;
}
/*
export function toStringPrimitiveFull(any){
    switch (typeof any) {
        case 'object': 
            if(any === null){
                return "§7§onull";
            }else if (any instanceof Error) {
                return `§6${any}\n${any.stack}`;
            }else{
                const base = any, names = Object.getOwnPropertyNames(base), symbols = Object.getOwnPropertySymbols(base);
                const keys = names.filter(a=>(base.__lookupGetter__?.(a) == undefined && base.__lookupSetter__?.(a) == undefined)).map(k=>`§7${k}§r§7: ${toStringPrimitiveShort(base[k])}§r`).concat(symbols.map(s=>`§r${toStringPrimitiveShort(s)}§r§7: ${toStringPrimitiveShort(base[s])}`));
                const realKeys = keys.slice(0,5), typeOf = getTypeOfObject(base);
                let output = `§7${(typeOf == "Object" || typeOf == '')?"":typeOf + " "}{${realKeys.join("§7, ")}${keys.length>5?"§r§7, ...":"§r§7"}}§r`;
                function buildLines(base, offSet = "  "){
                    const prototype = Object.getPrototypeOf(base);
                    for (const keyName of Object.getOwnPropertyNames(base)) {
                        let getter = base.__lookupGetter__?.(keyName);
                        let setter = base.__lookupSetter__?.(keyName);
                        if(getter == undefined&&setter == undefined){
                            output += `\n${offSet}§r${keyName}§7: §r${toStringPrimitive(base[keyName])}`;
                        } else {
                            if(getter != undefined) output += `\n${offSet}§7get§r ${keyName}§7: (...)`;
                            if(setter != undefined) output += `\n${offSet}§7set§r ${keyName}§7: (...)`;
                        }
                    }
                    for (const keySymbol of Object.getOwnPropertySymbols(base)){
                        let getter = base.__lookupGetter__?.(keySymbol);
                        let setter = base.__lookupSetter__?.(keySymbol);
                        if(getter == undefined&&setter == undefined){
                            output += `\n${offSet}§r${toStringPrimitiveShort(keySymbol)}§7: §r${toStringPrimitive(base[keySymbol])}`;
                        } else {
                            if(getter != undefined) output += `\n${offSet}§7get§r ${toStringPrimitiveShort(keySymbol)}§7: (...)`;
                            if(setter != undefined) output += `\n${offSet}§7set§r ${toStringPrimitiveShort(keySymbol)}§7: (...)`;
                        }
                    }
                    if(prototype != null){
                        const typOf = getTypeOfObject(prototype);
                        output += `\n${offSet}§r[[Prototype]]§r§7: ` + (typOf==""?"Object":typOf)
                        if(prototype != Object.prototype && prototype != Array.prototype && prototype != Map.prototype){
                            buildLines(prototype, offSet + "  ");
                        }
                    }
                }
                buildLines(base);
                return output;
            }
        case 'function': return any.toString();
        case 'symbol': return `§7Symbol(${any.description})`;
        case 'bigint':
        case 'number':
        case 'boolean': return `§3${any.toString()}§r`;
        case 'undefined': return "§7§oundefined";
        case 'string': return `§3"${any}"§r`;
        default:
            break;
    }
}
export function toStringPrimitive(any: any){
    switch (typeof any) {
        case 'object': 
            if(any === null){
                return "§7§onull§r";
            }else if (any instanceof Error) {
                return `§6${any}§r`;
            }else{
                const base = any, names = Object.getOwnPropertyNames(base), symbols = Object.getOwnPropertySymbols(base);
                const keys = names.map(k=>`§7${k}§r§7: ${toStringPrimitiveShort(base[k])}§r`).concat(symbols.map(s=>`§r${toStringPrimitiveShort(s)}§r§7: ${toStringPrimitiveShort(base[s])}`));
                const realKeys = keys.slice(0,5), typeOf = getTypeOfObject(base);
                return `§7${(typeOf == "Object" || typeOf == '')?"":typeOf + " "}{${realKeys.join("§7, ")}${keys.length>5?"§r§7, ...":"§r§7"}}`;
            }
        case 'function': return toFunctionString(any);
        case 'symbol': return `Symbol(${any.description})`;
        case 'bigint':
        case 'number':
        case 'boolean': return `§3${any.toString()}§r`;
        case 'undefined': return "§7§oundefined";
        case 'string': return `§6"${any}"§r`;
        default:
            break;
    }
}*/
function getTypeOfObject(obj: any): string{return (obj[Symbol.toStringTag]??((typeof obj === "function"?obj.name:undefined)??((obj.constructor?.prototype == obj?obj.constructor?.name:obj.__proto__?.constructor?.name)??"")));}
//@ts-ignore
globalThis[Symbol.toStringTag] = 'GlobalThis';
//@ts-ignore
globalThis.console[Symbol.toStringTag] = "Console";