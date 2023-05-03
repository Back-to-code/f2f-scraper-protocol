class Server {
    constructor() { }
}

export type ServerT = Server;
export function init(): ServerT {

    return new Server()
}
