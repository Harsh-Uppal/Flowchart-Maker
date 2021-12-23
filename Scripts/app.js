let pos = vector(0, 0), cellSize = 50, panSpeed = .5, cellSizeSpeed = .02,
    maxCellSize = 200, minCellSize = 10, bezierQuality = 30;
let canvas, zoomInp, gridlinesInp;
let flowchartItems = [], flowchartConnectors = [];
let dragEnabled = true, newConnector = null;

window.addEventListener('resize', setup);

function setup() {
    let p5Canvas = createCanvas(window.innerWidth, window.innerHeight);
    p5Canvas.mouseWheel(changeZoom);

    canvas = document.querySelector('canvas');
    zoomInp = document.querySelector('.generalProperties > .zoom > input');
    gridlinesInp = document.querySelector('.generalProperties > .gridlines > input');

    zoomInp.max = maxCellSize;
    zoomInp.min = minCellSize;

    strokeWeight(2);

    setCursor('grab');
    update();
    noLoop();
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

    setCursor('grabbing');
}

function mouseMoved() {
    pmouseX = mouseX;
    pmouseY = mouseY;
    update();
}

function mouseClicked(e) {
    if (e.srcElement.nodeName != 'CANVAS')
        return;

    if (newConnector != null)
        removeNewConnector();
}

function mouseReleased(e) {
    if (e.srcElement.nodeName != 'CANVAS')
        return;

    setCursor('grab');
}

function changeZoom(event) {
    cellSize = Math.round(
        Math.max(Math.min(event == undefined ? parseInt(zoomInp.value) : cellSize - event.deltaY * cellSizeSpeed,
            maxCellSize), minCellSize));
    zoomInp.value = cellSize;

    update();
}

function setCursor(type) {
    if (canvas.style.cursor != type)
        canvas.style.cursor = type;
}

function update() {
    background('#111');

    stroke('lime');
    if (gridlinesInp.checked)
        drawGridlines();

    for (let i = 0; i < flowchartItems.length; i++)
        flowchartItems[i].update();

    stroke('#fff');
    if (newConnector != null)
        flowchartConnectors[newConnector.index].changeP2(vector(mouseX, mouseY));

    for (let i = 0; i < flowchartConnectors.length; i++)
        flowchartConnectors[i].display();
}

function removeNewConnector() {
    flowchartConnectors.splice(newConnector.index, 1);
    newConnector = null;

    update();
}