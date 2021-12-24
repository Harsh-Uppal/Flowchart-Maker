let toolBar = {
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
    toolBar.node.style.marginLeft = toolBar.node.style.marginLeft == '0px' ? '-17vw' : '0px';
    toolBar.toggleEnabled();
}

function newFlowchartItem(type) {
    toolBar.node.style.marginLeft = '-17vw';

    flowchartItems.push(
        new FlowchartItem(type, vector((mouseX - pos.x), (mouseY - pos.y)).divide(cellSize), flowchartItems.length)
    );
}