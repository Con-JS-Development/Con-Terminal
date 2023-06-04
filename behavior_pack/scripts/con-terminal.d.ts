declare enum OutputType {
    SyntaxError = 0,
    Error = 1,
    Successfull = 2
}
declare function formatView(object: any, viewStyle?: ViewStyle): string;
declare function TerminalInput<s>(source: s, message: string, scope?: never[], console?: any): Promise<{
    type: OutputType;
    value: any;
    formatView: string;
    multicommand: boolean;
    startTime: number;
}>;
declare enum ViewStyle {
    Primitive = 0,
    Short = 1,
    Full = 2,
    Infinite = 3
}
declare function timeoutsSupported(): Promise<boolean>;
export { OutputType, formatView as FormatView, TerminalInput, timeoutsSupported };
