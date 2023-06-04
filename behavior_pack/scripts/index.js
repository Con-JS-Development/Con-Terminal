import { DynamicPropertiesDefinition, EntityTypes, MinecraftEntityTypes, Player, ScriptEventSource, system, world } from "@minecraft/server";
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
class Settings {
    constructor() {
        world.afterEvents.worldInitialize.subscribe(ev => {
            ev.propertyRegistry.registerEntityTypeDynamicProperties(new DynamicPropertiesDefinition().defineBoolean(propertyName, false), EntityTypes.get("minecraft:player"));
            ev.propertyRegistry.registerWorldDynamicProperties(new DynamicPropertiesDefinition()
                .defineBoolean("allow_blocks", true)
                .defineBoolean("allow_entities", true)
                .defineBoolean("allow_terminal", true)
                .defineBoolean("allow_terminal_all_players", false)
                .defineBoolean("terminal_require_op", true)
            )
        });
    }
    /**@type {boolean} */
    get allow_blocks() { return world.getDynamicProperty("allow_blocks") }
    set allow_blocks(v) { return world.setDynamicProperty("allow_blocks", v) }
    /**@type {boolean} */
    get allow_entities() { return world.getDynamicProperty("allow_entities") }
    set allow_entities(v) { return world.setDynamicProperty("allow_entities", v) }
    /**@type {boolean} */
    get allow_terminal() { return world.getDynamicProperty("allow_terminal") }
    set allow_terminal(v) { return world.setDynamicProperty("allow_terminal", v) }
    /**@type {boolean} */
    get allow_terminal_all_players() { return world.getDynamicProperty("allow_terminal_all_players") }
    set allow_terminal_all_players(v) { return world.setDynamicProperty("allow_terminal_all_players", v) }
    /**@type {boolean} */
    get terminal_require_op() { return world.getDynamicProperty("terminal_require_op") }
    set terminal_require_op(v) { return world.setDynamicProperty("terminal_require_op", v) }
}
const settings = new Settings;
world.beforeEvents.chatSend.subscribe(async (ev) => {
    const { sender, message } = ev, reg = message.match(/^( +|)>( +|)/g);
    if (reg !== null && (settings.terminal_require_op ? sender.isOp() : true) && ((sender.getDynamicProperty(propertyName) || settings.allow_terminal_all_players) && settings.allow_terminal)) {
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