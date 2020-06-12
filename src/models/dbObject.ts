import { Chat } from "./chat";
import { UnofficialStateInfo } from "./unofficialStateInfo";
import { SocialDistancing } from "./socialDistancing";
import { Resgistry } from "./registry";
import { General } from "./general";

export class DBObject {
    chats: Chat[];
    unofficialStateInfo: UnofficialStateInfo[];
    socialDistancing: SocialDistancing;
    registry: Resgistry;
    general_info: General;

    constructor() {
        this.chats = [];
        this.unofficialStateInfo = [];    
        this.general_info = new General();
        this.socialDistancing = new SocialDistancing();
        this.registry = new Resgistry();
    }
}