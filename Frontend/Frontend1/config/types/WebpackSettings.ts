export enum Modes {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production'
}


export interface ConfigPaths {
    entry : string,
    output: string,
    HTMLpath: string,
    absolutePath: string
}

export interface DevServer {
   port : number,
   path : string,
}

export interface WebpackSettings {
    paths : ConfigPaths,
    isDev: boolean,
    devServer : DevServer,
    mode : Modes,
    apiUrl: string
}

export interface EnvType {
    port : number,
    mode : Modes,
    apiUrl: string
}
