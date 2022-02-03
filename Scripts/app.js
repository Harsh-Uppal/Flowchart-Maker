var pos = vector(0, 0),
    cellSize = 50,
    panSpeed = .5,
    cellSizeSpeed = .02,
    maxCellSize = 200,
    minCellSize = 10,
    dragEnabled = true,
    generalInputs,
    canvas, 
    shiftPressed = false;

const flowchartItems = [],
    connectorQuality = 30;

window.addEventListener('resize', setup);

function setup() {
    let p5Canvas = createCanvas(window.innerWidth, window.innerHeight);
    p5Canvas.mouseWheel(changeZoom);

    generalInputs = loadInputs();
    generalInputs.zoom.onchange = 
    generalInputs.zoom.max = maxCellSize;
    generalInputs.zoom.min = minCellSize;

    canvas = document.querySelector('canvas');

    strokeWeight(2);
    setCursor('grab');
    update();
    noLoop();
}

function loadInputs() {
    return {
        zoom: document.querySelector('.generalProperties > .zoom > input'),
        gridlines: document.querySelector('.generalProperties > .gridlines > input'),
        gridColor: document.querySelector('.generalProperties > .gridlinesColor > input'),
        bgColor: document.querySelector('.generalProperties > .backgroundColor > input')
    };
}

function drawGridlines() {
    for (let x = pos.x % cellSize; x < width; x += cellSize)
        line(x, 0, x, height);

    for (let y = pos.y % cellSize; y < height; y += cellSize)
        line(0, y, width, y);
}

function mouseDragged(e) {
    if (e.srcElement.nodeName != 'CANVAS' || !dragEnabled)
        return;

    pos = vector(pos.x - (pmouseX - mouseX) * panSpeed, pos.y - (pmouseY - mouseY) * panSpeed);
    pmouseX = mouseX;
    pmouseY = mouseY;
    update();

    updateFlowchartPos();

    setCursor('grabbing');
}

function mouseMoved(e) {
    pmouseX = mouseX;
    pmouseY = mouseY;

    shiftPressed = e.shiftKey;

    update();
}

function mouseClicked(e) {
    if (e.srcElement.nodeName != 'CANVAS')
        return;

    if(FlowchartItem.connecting != null)
        FlowchartItem.connecting.connectTo(FlowchartItem.connecting.index);

        update();
}

function mouseReleased(e) {
    if (e.srcElement.nodeName != 'CANVAS')
        return;

    setCursor('grab');
}

function changeZoom(event) {
    cellSize = Math.round(
        Math.max(Math.min(event == undefined ? parseInt(generalInputs.zoom.value) : cellSize - event.deltaY * cellSizeSpeed,
            maxCellSize), minCellSize));
    generalInputs.zoom.value = cellSize;

    updateFlowchartPos();
    update();
}

function setCursor(type) {
    if (canvas.style.cursor != type)
        canvas.style.cursor = type;
}

function update() {
    background(generalInputs.bgColor.value);

    stroke(generalInputs.gridColor.value);
    if (generalInputs.gridlines.checked)
        drawGridlines();

    stroke('#fff');
    for (let i = 0; i < flowchartItems.length; i++)
        flowchartItems[i].update();
}

function updateFlowchartPos(){
    flowchartItems.forEach(item => {
        item.updatePosition();
    });
}