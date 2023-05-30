export declare enum OutputType {
    SyntaxError = 0,
    Error = 1,
    Successfull = 2
}
export declare enum LogTypes {
    log = 0,
    error = 1,
    warn = 2
}
export declare function TerminalInput<s>(source: s, message: string, scope?: never[], o?: (this: s, type: LogTypes, ...params: any[]) => void): Promise<{
    type: OutputType;
    value: any;
    formatView: string;
    multicommand: boolean;
    startTime: number;
}>;
