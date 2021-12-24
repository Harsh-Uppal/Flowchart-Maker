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
        this.topBar = document.createElement('div');
        let dataContainer = document.createElement('div');

        newItem.className = 'flowchartItem';
        newItem.id = flowchartItems.length;
        newItem.onclick = this.mouseClicked;
        newItem.style.top = this.pos.y + 'px';
        newItem.style.left = this.pos.x + 'px';

        this.topBar.className = 'topBar';
        this.topBar.draggable = true;
        this.topBar.ondragenter = this.mouseDragStart;
        this.topBar.ondrag = this.mouseDragged;
        this.topBar.ondragend = this.mouseDragEnd;

        this.itemConnector.className = 'connector';
        this.itemConnector.onclick = this.connectorClicked;

        dataContainer.className = 'dataContainer';

        switch (type) {
            case 'text':
                this.innerNode = document.createElement('div');
                this.innerNode.innerText = 'Write something here...';
                break;
            case 'image':
                this.innerNode = document.createElement('img');
                this.innerNode.setAttribute('src', './Assets/ImageIcon.png');
                break;
            case 'bar-graph':
                this.innerNode = document.createElement('img');
                this.innerNode.setAttribute('src', './Assets/BarGraph.png');
                break;
        }
        this.innerNode.className = type;

        dataContainer.appendChild(this.topBar);
        dataContainer.appendChild(this.innerNode);
        dataContainer.appendChild(this.itemConnector);

        newItem.appendChild(dataContainer);
        itemsContainer.appendChild(newItem);

        this.node = newItem;

        this.resetProperties();
    }
    mouseClicked = () => {
        if(!this.added)
            this.added = true;

        Inspector.setInspectorProperties(this.properties);
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

        this.node.style.transform = `translate(-50%, -50%) scale(${cellSize / 50 * this.properties.scale})`;
        this.updatePosition();
    }
    updatePosition() {
        this.node.style.top = this.pos.y * cellSize + pos.y + 'px';
        this.node.style.left = this.pos.x * cellSize + pos.x + 'px';

        if (this.connector != null)
            this.connector.changeP1(vector(this.node.offsetLeft + this.node.offsetWidth / 2, this.node.offsetTop));
    }
    setProperty = (property, val) => {
        this.properties[property] = val;

        switch (property) {
            case 'color':
                this.node.style.backgroundColor = val;
                break;
            case 'heading':
                this.topBar.textContent = val;
                break;
            case 'headColor':
                this.topBar.style.backgroundColor = val;
                break;
            case 'headFontColor':
                this.topBar.style.color = val;
                break;
            case 'scale':
                this.update();
                break;
            case 'text':
                this.innerNode.textContent = val;
                break;
            case 'fontColor':
                this.innerNode.style.color = val;
                break;
            case 'fontSize':
                this.innerNode.style.fontSize = val + 'px';
                break;
            case 'imageSrc':
                this.innerNode.setAttribute('src', val);
                break;
        }
    }

    resetProperties() {
        this.properties = {
            color: createProperty('Background Color', 'color', '#ADD8E6'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            scale: createProperty('Scale', 'number', 1),
            setProperty: this.setProperty
        };

        switch (this.type) {
            case 'text':
                this.properties.text = createProperty('Text', 'text', 'Write something here...');
                this.properties.fontSize = createProperty('Font Size', 'number', 10);
                this.properties.fontColor = createProperty('Font Color', 'color', '#000000');
                break;
            case 'image':
                this.properties.imageSrc = createProperty('Image Source', 'text', './Assets/ImageIcon.png');
                break;
        }

        this.properties.default = { ...this.properties };
    }
}