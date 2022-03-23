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
    Toolbar.node.style.marginLeft = Toolbar.node.style.marginLeft == '0px' ? 'min(-17vw, -13rem)' : '0px';
    Toolbar.toggleEnabled();
}

function newFlowchartItem(type) {
    moveToolbar();
    flowchartItems.push(new type(vector((mouseX - pos.x), (mouseY - pos.y)).divide(cellSize), flowchartItems.length));
}