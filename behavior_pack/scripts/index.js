import { world } from "@minecraft/server";
import { TerminalInput } from "./con-terminal";

world.beforeEvents.chatSend.subscribe(async (ev) => {
    const { sender, message } = ev;
    if (message.startsWith('>') && sender.isOp()) {
        ev.cancel = true;
        await null;
        const out = await TerminalInput(sender, message.substring(1));
        sender.sendMessage(out.formatView);
    }
});