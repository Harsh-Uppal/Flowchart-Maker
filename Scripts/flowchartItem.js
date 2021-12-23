class FlowchartItem {
    constructor(type, pos) {
        this.pos = pos;
        this.type = type;
        this.added = false;
        this.connector = null;
        this.connected = false;
        this.itemConnector = document.createElement('div');

        let itemsContainer = document.querySelector('.flowchartItems');
        let newItem = document.createElement('div');
        let topBar = document.createElement('div');
        let dataContainer = document.createElement('div');

        newItem.className = 'flowchartItem';
        newItem.id = flowchartItems.length;
        newItem.onclick = this.mouseClicked;
        newItem.style.top = this.pos.y + 'px';
        newItem.style.left = this.pos.x + 'px';

        topBar.className = 'topBar';
        topBar.draggable = true;
        topBar.ondragenter = this.mouseDragStart;
        topBar.ondrag = this.mouseDragged;
        topBar.ondragend = this.mouseDragEnd;

        this.itemConnector.className = 'connector';
        this.itemConnector.onclick = this.connectorClicked;

        dataContainer.className = 'dataContainer';

        let innerNode;
        switch (type) {
            case 'text':
                innerNode = document.createElement('div');
                innerNode.innerText = 'Write something here...';
                break;
            case 'image':
                innerNode = document.createElement('img');
                innerNode.setAttribute('src', './Assets/ImageIcon.png');
                break;
            case 'bar-graph':
                innerNode = document.createElement('img');
                innerNode.setAttribute('src', './Assets/BarGraph.png');
                break;
        }
        innerNode.className = type;

        dataContainer.appendChild(topBar);
        dataContainer.appendChild(innerNode);
        dataContainer.appendChild(this.itemConnector);

        newItem.appendChild(dataContainer);
        itemsContainer.appendChild(newItem);

        this.node = newItem;

        this.resetProperties();
    }
    mouseClicked = () => {
        if (!this.added)
            Inspector.setInspectorProperties(this.properties);

        this.added = true;

        Inspector.activate(true);
    }
    mouseDragStart = () => {
        dragEnabled = false;
    }
    mouseDragged = () => {
        this.pos = vector((mouseX - pos.x) / cellSize, (mouseY - pos.y) / cellSize);

        this.updatePosition();
    }
    mouseDragEnd = () => {
        this.lastDragPos = vector(mouseX, mouseY);
        dragEnabled = true;
    }
    connectorClicked = () => {
        this.connector = new CubicBezierCurve(
            vector(this.node.offsetLeft + this.node.offsetWidth / 2, this.node.offsetTop),
            vector(mouseX, mouseY)
        );

        if (newConnector != null)
            removeNewConnector();
        newConnector = { index: flowchartConnectors.length };
        flowchartConnectors.push(this.connector);
    }
    update() {
        if (!this.added)
            this.pos = vector(mouseX - pos.x, mouseY - pos.y).divide(cellSize);

        this.node.style.transform = `translate(-50%, -50%) scale(${cellSize / 50})`;
        this.updatePosition();
    }
    updatePosition() {
        this.node.style.top = this.pos.y * cellSize + pos.y + 'px';
        this.node.style.left = this.pos.x * cellSize + pos.x + 'px';

        if (this.connector != null)
            this.connector.changeP1(vector(this.node.offsetLeft + this.node.offsetWidth / 2, this.node.offsetTop));
    }
    setProperty(property, val) {
        this.properties[property] = val;
    }
    resetProperties() {
        this.properties = {
            color: createProperty('Color', 'color', '#ADD8E6'),
            headColor: createProperty('Heading Color', 'color', '#20B2AA'),
            heading: createProperty('Heading', 'text', ''),
            width: createProperty('Width', 'num', this.node.offsetWidth),
            height: createProperty('Height', 'num', this.node.offsetHeight),
        };

        switch (this.type) {
            case 'text':
                this.properties.text = createProperty('Text', 'text', 'Write something here...');
                this.properties.fontSize = createProperty('Font Size', 'num', 10);
                this.properties.fontColor = createProperty('Font Color', 'color', '#000000');
                break;
            case 'image':
                this.properties.imageURL = createProperty('Image Source', 'text', './Assets/ImageIcon.png');
                break;
        }

        this.properties.default = { ...this.properties };
    }
}