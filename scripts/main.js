import { world, ItemStack } from "@minecraft/server";

const SPACING = 3;
const COOLDOWN_MS = 1000;

const lastAutoPlace = new Map();

function msg(player, text) {
    try {
        player.onScreenDisplay.setActionBar(text);
    } catch {}
}

world.afterEvents.itemUseOn.subscribe((event) => {

    const player = event.source;

    try {

        const now = Date.now();

        const last =
            lastAutoPlace.get(player.id) ?? 0;

        if (now - last < COOLDOWN_MS) {
            return;
        }

        if (!player.isSneaking) {
            return;
        }

        const inventory =
            player.getComponent(
                "minecraft:inventory"
            );

        if (!inventory) {
            return;
        }

        const container =
            inventory.container;

        const slot =
            player.selectedSlotIndex;

        const item =
            container.getItem(slot);

        if (!item) {
            return;
        }

        const torchType =
            item.typeId;

        if (
            torchType !== "minecraft:torch" &&
            torchType !== "minecraft:soul_torch"
        ) {
            return;
        }

        const torchCount =
            item.amount;

        const start =
            event.block.location;

        const look =
            player.getViewDirection();

        const dx =
            Math.abs(look.x) >
            Math.abs(look.z)
                ? Math.sign(look.x)
                : 0;

        const dz =
            Math.abs(look.z) >=
            Math.abs(look.x)
                ? Math.sign(look.z)
                : 0;

        const dim =
            player.dimension;

        let placed = 0;

        for (
            let i = 1;
            i <= torchCount;
            i++
        ) {

            const x =
                start.x +
                dx * (i * SPACING);

            const z =
                start.z +
                dz * (i * SPACING);

            const y =
                start.y + 1;

            const placeBlock =
                dim.getBlock({
                    x,
                    y,
                    z
                });

            const floorBlock =
                dim.getBlock({
                    x,
                    y: y - 1,
                    z
                });

            if (!placeBlock) {
                break;
            }

            if (!floorBlock) {
                break;
            }

            // 空気以外なら停止
            if (
                placeBlock.typeId !==
                "minecraft:air"
            ) {
                break;
            }

            // 水・溶岩の上は禁止
            const floorId =
                floorBlock.typeId;

            if (
                floorId.includes("water") ||
                floorId.includes("lava")
            ) {
                break;
            }

            try {

                const torchName =
                    torchType ===
                    "minecraft:soul_torch"
                        ? "soul_torch"
                        : "torch";

                player.runCommand(
                    `setblock ${x} ${y} ${z} ${torchName}`
                );

                placed++;

            } catch {

                break;

            }
        }

        if (placed <= 0) {

            msg(
                player,
                "No valid location"
            );

            return;
        }

        const remain =
            torchCount - placed;

        if (remain <= 0) {

            container.setItem(slot);

        } else {

            container.setItem(
                slot,
                new ItemStack(
                    torchType,
                    remain
                )
            );
        }

        lastAutoPlace.set(
            player.id,
            now
        );

        msg(
            player,
            `Placed: ${placed}`
        );

    } catch (e) {

        msg(
            player,
            "ERROR"
        );

    }

});