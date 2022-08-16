const SelectionManager = (function () {
    let selectedItems = [], selectionRect = null;
    return {
        update: () => {
            if (selectionRect) {
                stroke('lime');
                fill('#00FFFF55');
                selectionRect.draw();
            }
        },
        mouseDragged: e => {
            if (!selectionRect && e.srcElement.nodeName == 'CANVAS')
                selectionRect = new Rectangle(mouseX, mouseY, 0, 0);

            if (selectionRect) {
                selectionRect.width += mouseX - pmouseX;
                selectionRect.height += mouseY - pmouseY;
            }
        },
        mouseReleased: () => {
            if (selectionRect) {
                if (!keyIsDown(16)) //16: Keycode for SHIFT
                    while (selectedItems.length)
                        selectedItems.shift().setSelected(false);

                flowchartItems.forEach(item => {
                    if (item.touches(selectionRect) && !item.selected) {
                        item.setSelected(true);
                        selectedItems.push(item);
                    }
                });

                selectionRect = null;
            }

            const properties = [];
            selectedItems.forEach(item => {
                properties.push(item.properties);
            });
            PropertiesPanel.inspectingProperties = properties;
            PropertiesPanel.activate(true);
            delete properties;
        },
        itemSelectChanged: item => {
            if (item.selected)
                selectedItems.push(item);
            else
                selectedItems = selectedItems.splice(selectedItems.findIndex(i => i.index == item.index) - 1, 1);
        },
        getSelectedItems: () => {
            return selectedItems;
        },
        nothingSelected: () => {
            selectedItems.forEach(item => {
                item.setSelected(false);
            });
            selectedItems = [];
            PropertiesPanel.activate(false);
        }
    };
})();