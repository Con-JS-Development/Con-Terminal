import { system} from "@minecraft/server";
const AsyncFunctionConstructor = (async function () { }).constructor;
const GeneratorFunctionConstructor = (function* () { }).constructor;
const AsyncGeneratorFunctionConstructor = (async function* () { }).constructor;
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
    { module_name: "@minecraft/server", tag: "mc" },
    { module_name: "@minecraft/server-ui", tag: "ui" },
    { module_name: "@minecraft/server-gametest", tag: "gametest" },
    { module_name: "@minecraft/server-net", tag: "net" },
    { module_name: "@minecraft/server-admin", tag: "admin" },
    { module_name: "@minecraft/server-editor", tag: "editor" },
    { module_name: "@minecraft/server-editor-bindings", tag: "bindings" }
];
var OutputType;
(function (OutputType) {
    OutputType[OutputType["SyntaxError"] = 0] = "SyntaxError";
    OutputType[OutputType["Error"] = 1] = "Error";
    OutputType[OutputType["Successfull"] = 2] = "Successfull";
})(OutputType || (OutputType = {}));
var LogTypes;
(function (LogTypes) {
    LogTypes[LogTypes["log"] = 0] = "log";
    LogTypes[LogTypes["error"] = 1] = "error";
    LogTypes[LogTypes["warn"] = 2] = "warn";
})(LogTypes || (LogTypes = {}));
const setInterval = (callBack, interval = 0, ...params) => runInterval(() => callBack(...params), interval);
const setTimeout = (callBack, interval = 0, ...params) => runTimeout(() => callBack(...params), interval);
function consoleLike(type, ...texts) {
    console.warn(`[Terminal-${LogTypes[type]}]: `, ...texts.map(a => getView[typeof a](ViewStyle.Short, a)));
}
function formatView(type, object) {
    return getView[typeof object](ViewStyle.Full, object);
}
export async function TerminalInput(source, message, o = consoleLike) {
    const a = await RunCode(message, true, { console: { log: o.bind(source, LogTypes.log), warn: o.bind(source, LogTypes.warn), error: o.bind(source, LogTypes.error) }, print: o.bind(source, LogTypes.log), self: source, setTimeout, setInterval, clearInterval: clearRun, clearTimeout: clearRun });
    const multicommand = a.multicommand;
    if (a.syntaxError)
        return { type: OutputType.SyntaxError, value: a.syntaxError, formatView: formatView(OutputType.SyntaxError, a.syntaxError), multicommand };
    try {
        const output = await a.promise;
        return { type: OutputType.Successfull, value: output, formatView: formatView(OutputType.Successfull, output), multicommand };
    }
    catch (error) {
        console.warn("It was handled xd, but after the promise returns");
        return { type: OutputType.Error, value: error, formatView: formatView(OutputType.Error, error), multicommand };
    }
}
async function RunCode(code, useModules = true, ...scopes) {
    let func, output = { syntaxError: undefined, promise: undefined, multicommand: false };
    const modules = useModules ? (await BuildAPIScope(...MinecraftModules)) : [];
    try {
        //@ts-ignore
        func = BuildNewFunction(this, code, ...modules, ...scopes);
    }
    catch (error) {
        output.syntaxError = error;
        return output;
    }
    output.multicommand = func.multicommand ?? false;
    output.promise = func();
    return output;
}
async function BuildAPIScope(...modules) {
    let promises = [];
    modules.forEach(m => promises.push(import(m.module_name).catch(() => ({}))));
    const dlls = await Promise.all(promises);
    return dlls.map((m, i) => ({ [modules[i].tag]: m }));
}
function BuildNewFunction(thisArg = globalThis, code, ...scopes) {
    let scope = {}, func;
    for (const s of scopes)
        Object.assign(scope, s);
    let keys = Object.getOwnPropertyNames(scope);
    try {
        if (code.endsWith(";"))
            code = code.substring(0, code.length - 1);
        func = AsyncFunctionConstructor.apply(AsyncFunctionConstructor, [...keys, "return (" + code + ")"]);
    }
    catch (error) {
        func = AsyncFunctionConstructor.apply(AsyncFunctionConstructor, [...keys, code]);
        func.multicommand = true;
    }
    const a = Function.prototype.bind.apply(func, [thisArg, ...keys.map(k => scope[k])]);
    a.multicommand = !!func.multicommand;
    return a;
}
var ViewStyle;
(function (ViewStyle) {
    ViewStyle[ViewStyle["Primitive"] = 0] = "Primitive";
    ViewStyle[ViewStyle["Short"] = 1] = "Short";
    ViewStyle[ViewStyle["Full"] = 2] = "Full";
})(ViewStyle || (ViewStyle = {}));
const getView = {
    "object"(style, any) {
        if (any === null)
            return "§7§onull";
        if (style === ViewStyle.Primitive) {
            const typeOf = getTypeOfObject(any);
            return `§7${(typeOf == "Object" || typeOf == '') ? "" : typeOf + " "}{...}`;
        }
        else if (style === ViewStyle.Short) {
            const names = Object.getOwnPropertyNames(any), symbols = Object.getOwnPropertySymbols(any);
            //@ts-ignore
            const keys = names.map(k => `§7${k}§r§7: ${getView[typeof any[k]](ViewStyle.Primitive, any[k])}§r`).concat(symbols.map(s => `§r${getView["symbol"](ViewStyle.Primitive, s)}§r§7: ${getView[typeof any[s]](ViewStyle.Primitive, any[s])}`));
            const realKeys = keys.slice(0, 5), typeOf = getTypeOfObject(any);
            return `§7${(typeOf == "Object" || typeOf == '') ? "" : typeOf + " "}{${realKeys.join("§7, ")}${keys.length > 5 ? "§r§7, ..." : "§r§7"}}`;
        }
        else {
            return getView["object"](ViewStyle.Short, any) + "\n" + buildCompoudView([], any, any).join('\n');
        }
    },
    "function"(n, any) {
        if (n === ViewStyle.Short) {
            const n = any.toString() ?? "", ctor = Object.getPrototypeOf(any).constructor;
            if (n.startsWith('class')) {
                return `§5§oclass §r§3${any.name}`;
            }
            else {
                return `§5§o${(ctor == AsyncFunctionConstructor ? "async ƒ " : (ctor == GeneratorFunctionConstructor ? "ƒ * " : (ctor == AsyncGeneratorFunctionConstructor ? "async ƒ * " : "ƒ ")))}§r§g${any.name}§7(${(n.match(/(?<=(^[^\(]+\()|\()(.*)(?=(\)([ ]+|)\{([^]+|)\}$)|(\)(([ ]+|)(\=\>)([ ]+|))))/) ?? ["error"])[0].replace(/  +/g, " ")})`;
            }
        }
        else if (n === ViewStyle.Primitive)
            return "§5§oƒ§r";
        else
            return getView["object"](ViewStyle.Short, any) + "\n" + buildCompoudView([], any, any, "  ", true).join('\n');
    },
    "number"(n, any) { return `§3${any.toString()}§r`; },
    "bigint"(n, any) { return `§3${any.toString()}§r`; },
    "boolean"(n, any) { return `§3${any.toString()}§r`; },
    "symbol"(n, any) { return `§7Symbol(${any.description})§r`; },
    "undefined"() { return "§7§oundefined§r"; },
    "string"(n, any) {
        if (n === ViewStyle.Full)
            return `§3"${any}"§r`;
        else if (n === ViewStyle.Short)
            return `§3"${any.split('\n')[0]}"§r`;
        else {
            const v = any.split('\n')[0];
            return `§3"${v.length > 20 ? (v.substring(0, 20) + "...") : v}"§r`;
        }
    }
};
function buildCompoudView(array, base, object, offSet = "  ", func = false, deepth = 1) {
    const off = offSet.repeat(deepth);
    const prototype = Object.getPrototypeOf(object);
    const descriptors = Object.getOwnPropertyDescriptors(object);
    for (const key of [...Object.getOwnPropertyNames(descriptors), ...Object.getOwnPropertySymbols(descriptors)]) {
        const { value, set, get } = descriptors[key];
        if (value) {
            array.push(`${off}§r${typeof key == "string" ? key : getView["symbol"](ViewStyle.Primitive, key)}§7: §r${getView[typeof value](ViewStyle.Short, value)}§r`);
        }
        else {
            if (get != undefined) {
                const v = get.call(base);
                array.push(`${off}§r§7get§r ${typeof key == "string" ? key : getView["symbol"](ViewStyle.Primitive, key)}§7: §r${getView[typeof v](ViewStyle.Short, v)}§r`);
            }
            if (set != undefined)
                array.push(`${off}§r§7set§r ${typeof key == "string" ? key : getView["symbol"](ViewStyle.Primitive, key)}§7: (...)§r`);
        }
    }
    if (func)
        array.push(`${off}§7[[Native Function]]: §7${getView["boolean"](ViewStyle.Primitive, object.toString().endsWith(nativeFunction))}§r`);
    if (prototype == null)
        return array;
    const typOf = getTypeOfObject(prototype);
    array.push(`${off}§7[[Prototype]]: ${(typOf == "" ? "Object" : typOf)}§r`);
    if (!safePrototypes.includes(prototype))
        buildCompoudView(array, base, prototype, offSet, typeof prototype === 'function', deepth + 1);
    return array;
}
function getTypeOfObject(obj) { return (obj[Symbol.toStringTag] ?? ((typeof obj === "function" ? obj.name : undefined) ?? ((obj.constructor?.prototype == obj ? obj.constructor?.name : obj.__proto__?.constructor?.name) ?? ""))); }
//@ts-ignore
globalThis[Symbol.toStringTag] = 'GlobalThis';
//@ts-ignore
globalThis.console[Symbol.toStringTag] = "Console";
