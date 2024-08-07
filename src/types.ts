import { IncomingMessage } from 'http';
import session from 'express-session';
import { Socket } from 'socket.io';


export interface CustomSocketRequest extends IncomingMessage {
  session: CustomSession;
  sessionID?: string
}

export interface CustomSession extends session.Session {
  socketID?: string;
}
export interface CustomSocket extends Socket {
  request: CustomSocketRequest
  sessionID?: string
}


export interface OptionsPluginSocketIO {
  /**
   * Enable or disable plugin
   * @default false
   */
  enabled?: boolean,
  dev?: boolean,
  onConnect?: Array<(socket: Socket) => void>,
}

