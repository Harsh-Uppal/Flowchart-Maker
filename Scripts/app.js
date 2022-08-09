var pos = vector(0, 0),
    cellSize = 50,
    panSpeed = .5,
    cellSizeSpeed = .02,
    maxCellSize = 200,
    minCellSize = 10,
    dragEnabled = true,
    generalInputs,
    canvas,
    shiftPressed = false,
    updateOnMouseMoved = true,
    titleOptions,
    editBtn,
    editingEnabled = true,
    imgBg;

const flowchartItems = [],
    connectorQuality = 30;

window.addEventListener('resize', setup);

function setup() {
    imgBg = document.getElementById('imageBackground');
    titleOptions = document.getElementById('titleOptions');
    editBtn = document.getElementById('editBtn');

    editBtn.addEventListener('click', editBtnClicked);

    const p5Canvas = createCanvas(window.innerWidth, window.innerHeight);
    p5Canvas.mouseWheel(changeZoom);
    canvas = document.querySelector('canvas');

    generalInputs = loadInputs();
    generalInputs.zoom.max = maxCellSize;
    generalInputs.zoom.min = minCellSize;
    generalInputs.bg.addEventListener('change', () => {
        imgBg.src = generalInputs.bg.type == 'image' ? generalInputs.bg.value : null;
        imgBg.style.display = generalInputs.bg.type == 'image' ? '' : 'none';
        if (generalInputs.bg.type == 'color')
            document.body.style.backgroundColor = generalInputs.bg.value;
    });

    setCursor('crosshair');
    update();
    noLoop();
}

function editBtnClicked() {
    editingEnabled = !editingEnabled;

    if (editingEnabled) editBtn.classList.remove('striked');
    else editBtn.classList.add('striked');

    editBtn.title = editingEnabled ? 'Disable Editing' : 'Enable Editing';
    PropertiesPanel.activate(editingEnabled);
    Toolbar.enable(editingEnabled);
    generalInputs.gridlines.checked = editingEnabled;
    generalInputs.gridlines.disabled = !editingEnabled;
    generalInputs.bg.disabled = !editingEnabled;

    update();
}

function loadInputs() {
    return {
        zoom: document.querySelector('.generalProperties > .zoom > input'),
        gridlines: document.querySelector('.generalProperties > .gridlines > input'),
        gridColor: document.querySelector('.generalProperties > .gridlinesColor > input'),
        bg: document.getElementById('backgroundInput')
    };
}

function drawGridlines() {
    strokeWeight(2);

    for (let x = pos.x % cellSize; x < width; x += cellSize)
        line(x, 0, x, height);

    for (let y = pos.y % cellSize; y < height; y += cellSize)
        line(0, y, width, y);
}

function mouseDragged(e) {
    switch (e.which) {
        case 1:
            SelectionManager.mouseDragged(e);
            break;
        case 2:
            if (!dragEnabled || e.srcElement.nodeName != 'CANVAS')
                return;

            pos = vector(pos.x - (pmouseX - mouseX) * panSpeed, pos.y - (pmouseY - mouseY) * panSpeed);

            updateFlowchartPos();

            setCursor('grabbing');
            break;
    }

    update();

    pmouseX = mouseX;
    pmouseY = mouseY;
}

function mouseMoved(e) {
    if (!updateOnMouseMoved)
        return;

    pmouseX = mouseX;
    pmouseY = mouseY;

    shiftPressed = e.shiftKey;

    update();
}

function mouseClicked(e) {
    if (titleOptions)
        titleOptions.style.display =
            e.srcElement.parentNode.id == 'titleOptionsBtn' || e.srcElement.id == 'titleOptionsBtn' ?
                (titleOptions.style.display == '' ? 'none' : '') : 'none';

    if (e.srcElement.nodeName != 'CANVAS')
        return;

    if (FlowchartItem.connecting != null)
        FlowchartItem.connecting.connectTo(FlowchartItem.connecting.index);

    update();
}

function mouseReleased(e) {
    SelectionManager.mouseReleased();

    if (e.srcElement.nodeName != 'CANVAS')
        return;

    setCursor('crosshair');
}

function changeZoom(e) {
    generalInputs.zoom.value = cellSize = Math.round(
        Math.max(Math.min(e == undefined ? parseInt(generalInputs.zoom.value) : cellSize - e.deltaY * cellSizeSpeed,
            maxCellSize), minCellSize));

    updateFlowchartPos();
    update();
}

function setCursor(type) {
    if (canvas.style.cursor != type)
        canvas.style.cursor = type;
}

function update() {
    clear();

    stroke(generalInputs.gridColor.value);
    if (generalInputs.gridlines.checked)
        drawGridlines();

    stroke('#fff');
    drawCurves();

    for (let i = 0; i < flowchartItems.length; i++)
        flowchartItems[i].update();

    SelectionManager.update();
}