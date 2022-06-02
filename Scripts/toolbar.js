const Toolbar = (() => {
    let node, enabled = true;

    return {
        move: () => {
            node = node || document.getElementById('toolbar');

            node.style.marginLeft = enabled ? 'min(-17vw, -13rem)' : '0px';
            enabled = !enabled;
        },
        enable: e => {
            node = node || document.getElementById('toolbar');
            node.style.display = e ? '' : 'none';
        }
    }
})();

function newFlowchartItem(type) {
    Toolbar.move();
    flowchartItems.push(new type(vector((mouseX - pos.x), (mouseY - pos.y)).divide(cellSize), flowchartItems.length));
}