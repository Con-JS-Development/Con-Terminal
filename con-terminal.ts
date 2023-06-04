const symbolError = Symbol("RunError");
const AsyncFunctionConstructor = (async function () {}).constructor;
const GeneratorFunctionConstructor = (function* (){}).constructor;
const AsyncGeneratorFunctionConstructor = (async function *(){}).constructor;
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
    warn,
    info
}
const consoleTamplate = {
    log:consoleLike.bind(null,LogTypes.log),
    warn:consoleLike.bind(null,LogTypes.warn),
    error:consoleLike.bind(null,LogTypes.error),
    info:consoleLike.bind(null,LogTypes.info)
}
const runsTemplate: any = {};
function consoleLike(type: LogTypes,...texts: any[]): void{
    console.warn(`[Terminal-${LogTypes[type]}]: `, ...texts.map(a=>getView[typeof a](ViewStyle.Short, a)));
}
function formatView(object: any, viewStyle: ViewStyle = ViewStyle.Full): string{
    return getView[typeof object](viewStyle, object);
}
async function TerminalInput<s>(source: s, message: string, scope = [], console: any = consoleTamplate){
    const a = await RunCode(message, true, {console:{...console},print:consoleLike.bind(null,LogTypes.log), self:source},runsTemplate,...scope);
    const {multicommand, startTime} = a;
    if(a.syntaxError) return {type: OutputType.SyntaxError, value: a.syntaxError, formatView: formatView(a.syntaxError),multicommand, startTime};
    const output = await a.promise;
    if(typeof output === "object" && output !== null && symbolError in output) return {type: OutputType.Error, value: output[symbolError], formatView: formatView(output[symbolError]),multicommand, startTime};
    return {type: OutputType.Successfull, value: output, formatView: formatView(output),multicommand, startTime};
}
async function RunCode(code: string, useModules = true, ...scopes: any[]): Promise<{syntaxError?:any, promise?: Promise<any | never>, multicommand: boolean, startTime: number}> {
    let func, output: any = {syntaxError: undefined, promise: undefined, multicommand: false};
    const modules = useModules?(await BuildAPIScope(...MinecraftModules)):[];
    try {
        //@ts-ignore
        func = BuildNewFunction(this as any, code,...modules,...scopes);
    } catch (error) {
        output.syntaxError = error as any;
        return output;
    }
    output.multicommand = func.multicommand??false;
    output.startTime = Date.now();
    output.promise = Promise.resolve(func()).catch(er=>({[symbolError]: er}));
    return output;
}
async function BuildAPIScope(...modules: {module_name:string, tag:string}[]){
    let promises: Promise<any>[] = [];
    modules.forEach(m=>promises.push(import(m.module_name).catch(()=>null)));
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
    Full,
    Infinite
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
            const keys = names.map(k=>{
                try {
                    return `§7${k}§r§7: ${getView[typeof any[k]](ViewStyle.Primitive, any[k])}§r`;
                } catch (error) {
                    return `§7${k}§r§7: §o(...)§r`;
                }
            }).concat(symbols.map(s=>{
                try {
                    return `§r${getView["symbol"](ViewStyle.Primitive,s)}§r§7: ${getView[typeof any[s]](ViewStyle.Primitive,any[s])}`;
                } catch (error) {
                    return `§r${getView["symbol"](ViewStyle.Primitive,s)}§r§7: §o(...)§r`;
                }
            }));
            Object.getOwnPropertyDescriptor
            const realKeys = keys.slice(0,5), typeOf = getTypeOfObject(any);
            return `§7${(typeOf == "Object" || typeOf == '')?"":typeOf + " "}{${realKeys.join("§7, ")}${keys.length>5?"§r§7, ...":"§r§7"}}`;
        }
        else {
            return getView["object"](ViewStyle.Short, any) + "\n" + buildCompoudView(style,[],any,any).join('\n');
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
        else return  getView["function"](ViewStyle.Short, any) + "\n" + buildCompoudView(n,[],any,any,"  ",true).join('\n');
    },
    "number"(n: ViewStyle, any: number){return `§3${any.toString()}§r`},
    "bigint"(n: ViewStyle, any: bigint){return `§3${any.toString()}§r`},
    "boolean"(n: ViewStyle, any: boolean){return `§3${any.toString()}§r`},
    "symbol"(n: ViewStyle, any: symbol){return `§7Symbol(${any.description})§r`},
    "undefined"(){return "§7§oundefined§r"},
    "string"(n: ViewStyle, any: string){ 
        if(n === ViewStyle.Full || n == ViewStyle.Infinite) return `§3"${any}"§r`;
        else if(n === ViewStyle.Short) return `§3"${any.split('\n')[0]}"§r`;
        else {
            const v = any.split('\n')[0];
            return `§3"${v.length>20?(v.substring(0,20)+"..."):v}"§r`;
        }
    }
};
function buildCompoudView(viewStyle: ViewStyle, array: string[], base: any, object: any, offSet = "  ", func = false, deepth = 1, knownSets:any[] = []){
    const off = offSet.repeat(deepth);
    const prototype = Object.getPrototypeOf(object);
    const descriptors = Object.getOwnPropertyDescriptors(object);
    knownSets.push(object);
    for (const key of [...Object.getOwnPropertyNames(descriptors),...Object.getOwnPropertySymbols(descriptors)]){
        const desc = descriptors[key as string], {value,set,get} = desc;
        if("value" in desc){
            //@ts-ignore
            if(viewStyle != ViewStyle.Infinite || typeof value !== "object")
                array.push(`${off}§r${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §r${getView[typeof value](ViewStyle.Short,value)}§r`);
            else if(knownSets.includes(value)) array.push(`${off}§r${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §c::Recursive:: §r${getView[typeof value](ViewStyle.Short,value)}§r`);
            else {
                array.push(`${off}§r${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §r`);
                buildCompoudView(viewStyle,array,value,value, offSet, typeof value === "function", deepth + 1, [...knownSets]);
            }
        }else{
            if(get != undefined){
                try {
                    const v = get.call(base);
                    //@ts-ignore
                    if(viewStyle != ViewStyle.Infinite || typeof v !== "object")
                        array.push(`${off}§r§7get§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §r${getView[typeof v](ViewStyle.Short,v)}§r`);
                    else if(knownSets.includes(v)) array.push(`${off}§r§7get§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §c::Recursive:: §r${getView[typeof v](ViewStyle.Short,v)}§r`);
                    else {
                        array.push(`${off}§r§7get§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7:§r`);
                        buildCompoudView(viewStyle,array,v,v, offSet, typeof v === "function", deepth + 1, [...knownSets]);
                    }
                } catch (error) {
                    array.push(`${off}§r§7get§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §o(...)§r`);
                }
            }
            if(set != undefined) array.push(`${off}§r§7set§r ${typeof key == "string"?key:getView["symbol"](ViewStyle.Primitive, key)}§7: §o(...)§r`);
        }
    }
    if(func) array.push(`${off}§7[[Native Function]]: §7${getView["boolean"](ViewStyle.Primitive, object.toString().endsWith(nativeFunction))}§r`);
    if(prototype == null) return array;
    const typOf = getTypeOfObject(prototype);
    if(!safePrototypes.includes(prototype)){
        array.push(`${off}§7[[Prototype]]: ${(typOf==""?"Object":typOf)}§r`);
        buildCompoudView(viewStyle,array, base, prototype, offSet, typeof prototype === 'function', deepth + 1, [...knownSets]);
    }
    else array.push(`${off}§7[[Prototype]]: ${(typOf==""?"Object":typOf)} §r${getView[typeof prototype](ViewStyle.Short,prototype)}§r`);
    return array;
}
function getTypeOfObject(obj: any): string{return (obj[Symbol.toStringTag]??((typeof obj === "function"?obj.name:undefined)??((obj.constructor?.prototype == obj?obj.constructor?.name:obj.__proto__?.constructor?.name)??"")));}
async function timeoutsInit(){
    const a = await import("@minecraft/server").catch(e=>null);
    if(a === null) return;
    if(a.system?.runTimeout == undefined) return;
    const system = a.system;
    const runInterval = system.runInterval.bind(system);
    const runTimeout = system.runTimeout.bind(system);
    const clearRun = system.clearRun.bind(system);
    runsTemplate.setInterval = (callBack: Function, interval = 0, ...params: any[])=>runInterval(()=>callBack(...params),interval);
    runsTemplate.setTimeout = (callBack: Function, interval = 0, ...params: any[])=>runTimeout(()=>callBack(...params),interval);
    runsTemplate.clearInterval = clearRun;
    runsTemplate.clearTimeout = clearRun;
}
async function timeoutsSupported(){
    const a = await import("@minecraft/server").catch(e=>{}) as any;
    return a?.system?.runTimeout !== undefined;
}
//@ts-ignore
globalThis[Symbol.toStringTag] = 'GlobalThis';
//@ts-ignore
globalThis.console[Symbol.toStringTag] = "Console";
timeoutsInit();

export {OutputType, formatView as FormatView, TerminalInput, timeoutsSupported};