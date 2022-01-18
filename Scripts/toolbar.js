const Toolbar = {
    _node: null,
    _enabled: true,
    get node() {
        if (this._node == null)
            this._node = document.querySelector('.toolbar');

        return this._node;
    },
    get enabled() {
        return this._enabled;
    },
    toggleEnabled() {
        this._enabled = !this._enabled;
    }
};

function moveToolbar() {
    Toolbar.node.style.marginLeft = Toolbar.node.style.marginLeft == '0px' ? '-17vw' : '0px';
    Toolbar.toggleEnabled();
}

function newFlowchartItem(type) {
    moveToolbar();

    const itemPos = vector((mouseX - pos.x), (mouseY - pos.y)).divide(cellSize);
    const itemIndex = flowchartItems.length;

    let newItem;
    switch (type) {
        case 'text':
            newItem = new FlowchartTextBox(itemPos, itemIndex);
            break;
        case 'image':
            newItem = new FlowchartImage(itemPos, itemIndex);
            break;
        case 'bar-graph':
            newItem = new FlowchartBarGraph(itemPos, itemIndex);
            break;
        default:
            return;
    }

    flowchartItems.push(newItem);
}