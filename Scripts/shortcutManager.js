class Shortcut {
    constructor(name, key0, key1, func) {
        this.name = name;
        this.key0 = key0;
        this.key1 = key1;
        this.call = func;
    }
}

const ShortcutManager = (function () {
    let shortcuts = [
        new Shortcut('toolbar', 16, 84, Toolbar.move),
        new Shortcut('properties', 16, 80, () => {
            const item = document.activeElement;
            const itemsContainer = document.querySelector('.flowchartItems');

            if (!item || !itemsContainer || !itemsContainer.contains(item))
                return;

            let currentElement = item, parent;
            while (true) {
                parent = currentElement.parentNode;

                if (parent == itemsContainer)
                    break;

                currentElement = parent;
            }

            SelectionManager.nothingSelected();
            currentElement.flowchartObj.setSelected(true);
            SelectionManager.itemSelectChanged(currentElement.flowchartObj);
        }),
        new Shortcut('delete', 16, 46, () => SelectionManager.getSelectedItems().forEach(item => item.delete())),
        new Shortcut('focus', 16, 70, () => {
            if (SelectionManager.getItemCount() > 0) SelectionManager.getSelectedItems()[0].focus();
            update();
            updateFlowchartPos();
        })
    ];

    return {
        getShortcutKeys: name => {
            const shortcut = shortcuts.find(x => x.name == name);
            return [shortcut.key0, shortcut.key1];
        },
        setShortcutKeys: (name, keys) => {
            if (!Array.isArray(keys) || keys.length != 2)
                return;

            const i = shortcuts.findIndex(x => x.name == name);
            if (i < 0) return;

            shortcuts[i].key0 = keys[0];
            shortcuts[i].key1 = keys[1];
        },
        callShortcut: name => shortcuts.find(x => x.name == name).call(),
        keyDown: keyCode => {
            shortcuts.forEach(shortcut => {
                if (shortcut.key1 == keyCode && keyIsDown(shortcut.key0)) {
                    shortcut.call();
                    return true;
                }
            });
        }
    }
})();