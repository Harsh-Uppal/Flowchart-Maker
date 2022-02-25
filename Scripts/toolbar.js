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

    let itemType;
    switch (type) {
        case 'text':
            itemType = FlowchartTextBox;
            break;
        case 'image':
            itemType = FlowchartImage;
            break;
        case 'bar-graph':
            itemType = FlowchartBarGraph;
            break;
        case 'list':
            itemType = FlowchartList;
            break;
        case 'pie-chart':
            itemType = FlowchartPieChart;
            break;
        default:
            alert('Coming soon!');
            return;
    }

    flowchartItems.push(new itemType(vector((mouseX - pos.x), (mouseY - pos.y)).divide(cellSize), flowchartItems.length));
}