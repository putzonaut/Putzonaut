export const MESSAGE_MAX_LENGTH=2000;
export type Message={id:number;senderId:string;text:string;createdAt:string};
export type MessageContact={id:string;name:string;outfit:string;unread:number};
export type MessageScope={householdId:string;viewerId:string;restoreEpoch:string};
export type MessageInbox=MessageScope&{contacts:MessageContact[];unread:number};
export type MessagePage=MessageScope&{items:Message[];olderCursor:number|null;hasMore:boolean};
