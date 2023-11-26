import { Player, system, world } from "@minecraft/server";
import { OutputType, TerminalInput } from "./con-terminal";

const propertyName = "allow_terminal";
const currentScope = {
    system, world,
    worldBeforeEvents: world.beforeEvents,
    worldAfterEvents: world.afterEvents,
    systemBeforeEvents: system.beforeEvents,
    systemAfterEvents: system.afterEvents,
    delay(ticks) { return new Promise(res => system.runTimeout(res, ticks)) }
}
world.beforeEvents.chatSend.subscribe(async (ev) => {
    const { sender, message } = ev, reg = message.match(/^( +|)>( +|)/g);
    if (reg !== null) {
        ev.cancel = true;
        const code = message.substring(reg[0].length);
        const task = TerminalInput(sender, code, [currentScope]).catch(er => console.error(er, er.stack));
        sender.sendMessage("  §l§h> §r§7" + code);
        const out = await task;
        switch (out.type) {
            case OutputType.Successfull:
            case 2:
                return sender.sendMessage("  §l§q< §r" + out.formatView.replaceAll("\n", "\n    "));
            case OutputType.SyntaxError:
            case 0:
                return sender.sendMessage("  §l§4> §6" + out.value.message);
            case OutputType.Error:
            case 1:
                return sender.sendMessage("  §l§6< §7" + out.value);
            default:
                break;
        }
    }
});
system.afterEvents.scriptEventReceive.subscribe(({ id, sourceBlock, sourceEntity, initiator, message }) => {
    if (id === "con:terminal_run") {
        if (sourceBlock && settings.allow_blocks) TerminalInput(sourceBlock, message, [currentScope]).catch(er => console.error(er, er.stack));
        if (sourceEntity && settings.allow_entities) TerminalInput(sourceEntity, message, [currentScope, { initiator }]).catch(er => console.error(er, er.stack));
        return;
    }
    switch (id) {
        case "con:terminal_player_enable":
            if (sourceEntity instanceof Player) {
                sourceEntity.setDynamicProperty(propertyName, true);
                sourceEntity.sendMessage("You are now able to use terminal.");
            }
            break;
        case "con:terminal_player_disable":
            if (sourceEntity instanceof Player) {
                sourceEntity.setDynamicProperty(propertyName, false);
                sourceEntity.sendMessage("You are no longer able to use terminal.");
            }
            break;
        case "con:terminal_all_players_enable":
            settings.allow_terminal_all_players = true;
            break;
        case "con:terminal_all_players_disable":
            settings.allow_terminal_all_players = false;
            break;
        case "con:terminal_allow_blocks_enable":
            settings.allow_blocks = true;
            break;
        case "con:terminal_allow_blocks_disable":
            settings.allow_blocks = false;
            break;
        case "con:terminal_allow_entities_enable":
            settings.allow_entities = true;
            break;
        case "con:terminal_allow_entities_disable":
            settings.allow_entities = false;
            break;
        case "con:terminal_enable":
            settings.allow_terminal = true;
            break;
        case "con:terminal_disable":
            settings.allow_terminal = false;
            break;
        case "con:terminal_require_op_enable":
            settings.terminal_require_op = true;
            break;
        case "con:terminal_require_op_disable":
            settings.terminal_require_op = false;
            break;
        default:
            break;
    }
}, { namespaces: ["con"] });