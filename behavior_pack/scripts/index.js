import { DynamicPropertiesDefinition, MessageSourceType, MinecraftEntityTypes, system, world } from "@minecraft/server";
import { OutputType, TerminalInput } from "./con-terminal";

const propertyName = "allow_terminal";

world.beforeEvents.chatSend.subscribe(async (ev) => {
    const { sender, message } = ev, reg = message.match(/^( +|)>( +|)/g);
    if (reg !== null && sender.isOp() && sender.getDynamicProperty(propertyName)) {
        ev.cancel = true;
        const code = message.substring(reg[0].length);
        const task = TerminalInput(sender, code).catch(er=>console.error(er,er.stack));
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
world.afterEvents.worldInitialize.subscribe(ev=>ev.propertyRegistry.registerEntityTypeDynamicProperties(new DynamicPropertiesDefinition().defineBoolean(propertyName,false),MinecraftEntityTypes.player))
system.events.scriptEventReceive.subscribe(ev=>{
    if(ev.sourceType !== MessageSourceType.clientScript || ev.sourceEntity == null) return;
    if(ev.id === "con:terminal_enable") {
        ev.sourceEntity.setDynamicProperty(propertyName, true);
        ev.sourceEntity.sendMessage("You are now able to use terminal.");
    }
    if(ev.id === "con:terminal_disable") {
        ev.sourceEntity.setDynamicProperty(propertyName, false);
        ev.sourceEntity.sendMessage("You are no longer able to use terminal.");
    }
},{namespaces:["con"]});