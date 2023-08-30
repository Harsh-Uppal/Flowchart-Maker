const SelectionManager = (function () {
    let selectedItems = [], selectionRect = null;
    return {
        getItemCount: () => selectedItems.length,
        update: () => {
            if (editingEnabled && selectionRect) {
                stroke('lime');
                fill('#00FFFF55');
                selectionRect.draw();
            }
        },
        mouseDragged: e => {
            if (!editingEnabled)
                return;

            if (!selectionRect && e.srcElement.nodeName == 'CANVAS')
                selectionRect = new Rectangle(mouseX, mouseY, 0, 0);

            if (selectionRect) {
                selectionRect.width += mouseX - pmouseX;
                selectionRect.height += mouseY - pmouseY;
            }
        },
        mouseReleased: () => {
            if (!editingEnabled)
                return;

            if (selectionRect) {
                flowchartItems.filter(item => item.touches(selectionRect) && !item.selected).forEach(item => {
                    item.setSelected(true);
                    selectedItems.push(item);
                });

                selectionRect = null;
                SelectionManager.updatePropertiesPanel();
            }
        },
        itemSelectChanged: item => {
            if (item.selected)
                selectedItems.push(item);
            else
                selectedItems.splice(selectedItems.findIndex(i => i.index == item.index), 1);

            SelectionManager.updatePropertiesPanel();
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
        },
        updatePropertiesPanel: () => {
            const properties = [];
            selectedItems.forEach(item => {
                properties.push(item.properties);
            });

            PropertiesPanel.feedProps(properties);
            PropertiesPanel.activate(properties.length);
            delete properties;
        }
    };
})();