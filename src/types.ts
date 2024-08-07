import { IncomingMessage } from 'http';
import session from 'express-session';
import 'socket.io';


interface CustomIncomingMessageSession extends session.Session {
  socketID?: string;
}

export interface SessionIncomingMessage extends IncomingMessage {
  session?: CustomIncomingMessageSession;
}



export interface PluginTypes {
  /**
   * Enable or disable plugin
   * @default false
   */
  enabled?: boolean
}

export interface NewCollectionTypes {
  title: string
}
