class FlowchartItem {
    constructor(type, pos, index) {
        this.pos = pos;
        this.type = type;
        this.added = false;
        this.newConnector = null;
        this.index = index;
        this.connectingCurves = [];
        this.connectors = [];
        this.clickEnabled = true;
        this.lastMouseAngle = vector(Infinity, Infinity);
        this.scale = () => cellSize / 50;

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

        newItem.appendChild(dataContainer);
        itemsContainer.appendChild(newItem);

        this.node = newItem;

        this.resetProperties();
    }
    mouseClicked = () => {
        if (!this.clickEnabled) {
            this.clickEnabled = true;
            return;
        }
        if (!this.added)
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
    calculateConnectorPos = connectorAngle => vector(
        100 + connectorAngle % 100 - 50,
        100 - Math.abs(connectorAngle)
    );
    connectorClicked = index => {
        this.clickEnabled = false;
        if (FlowchartItem.connecting != null) {
            FlowchartItem.connecting.connectTo(this.index, () => this.pos.mult(cellSize).add(pos).add(this.calculateConnectorPos(this.connectors[index].rotation).sub(vector(50, 50)).mult(vector(
                this.node.offsetWidth / 100,
                this.node.offsetHeight / 100
            ).mult(this.scale()))));
            return;
        }

        if (index == null || this.connectors == null || this.connectors.length == 0)
            return;

        if (this.connectingCurves.length > 0 && !this.connectingCurves[this.connectingCurves.length - 1].connected)
            this.connectingCurves.splice(this.connectingCurves.length - 1, 1);

        if (index === this.newConnector) {
            this.connectors[this.newConnector].className = 'connector'
            this.connectors.forEach((connector, i) => {
                if (i != this.newConnector && connector.rotation == this.connectors[this.newConnector].rotation) {
                    this.connectors[this.newConnector].remove();
                    this.connectors.splice(this.newConnector, 1);
                    return true;
                }
            });
            this.newConnector = null;
            return;
        }

        this.connectingCurves.push({
            curve: new Curve(
                () => this.pos.mult(cellSize).add(pos).add(this.calculateConnectorPos(this.connectors[index].rotation).sub(vector(50, 50)).mult(vector(
                    this.node.offsetWidth / 100,
                    this.node.offsetHeight / 100
                ).mult(this.scale()))),
                () => vector(mouseX, mouseY)
            ),
            connected: false
        });

        FlowchartItem.connecting = this;
    }
    update() {
        if (!this.added)
            this.pos = vector(mouseX - pos.x, mouseY - pos.y).divide(cellSize);

        this.node.style.transform = `translate(-50%, -50%) scale(${this.scale()})`;

        this.updatePosition();

        this.connectingCurves.forEach(({
            curve
        }) => {
            curve.display();
        });

        if (this.newConnector != null) {
            const dirVec = vector(mouseX, mouseY).sub(this.pos.mult(cellSize).add(pos));
            const angle = Math.atan2(dirVec.x, dirVec.y);
            const roundedAngle = Math.round(angle / (Math.PI / 2)) * 50;

            if (roundedAngle != this.lastMouseAngle) {
                this.lastMouseAngle = roundedAngle;

                const calculatedPos = this.calculateConnectorPos(roundedAngle);
                this.connectors[this.newConnector].style.top = calculatedPos.y + '%';
                this.connectors[this.newConnector].style.left = calculatedPos.x + '%';
                this.connectors[this.newConnector].rotation = roundedAngle;
            }
        }
    }
    updatePosition() {
        this.node.style.top = this.pos.y * cellSize + pos.y + 'px';
        this.node.style.left = this.pos.x * cellSize + pos.x + 'px';

        if (this.connector != null)
            this.connector.changeP1(vector(this.node.offsetLeft + this.node.offsetWidth / 2, this.node.offsetTop));
    }
    setProperty = (property, val) => {
        if (property == 'setProperty' || property == 'default')
            return;

        const propertyObj = this.properties[property];
        this.properties[property] = createProperty(propertyObj.name, propertyObj.type, val, propertyObj.options);
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
            case 'width':
                this.innerNode.style.width = val + 'px';
                break;
            case 'height':
                this.innerNode.style.height = val + 'px';
                break;
            case 'text':
                this.innerNode.textContent = val;
                break;
            case 'fontColor':
                this.innerNode.style.color = val;
                break;
            case 'fontSize':
                this.innerNode.style.fontSize = val + 'vw';
                break;
            case 'imageSrc':
                this.innerNode.setAttribute('src', val);
                break;
        }
    }
    addConnector = () => {
        Inspector.activate(false);

        const newConnector = this.connectors.length;
        this.newConnector = newConnector;
        this.connectors.push(document.createElement('div'));
        this.connectors[newConnector].className = 'connector temp';
        this.connectors[newConnector].onclick = () => this.connectorClicked(newConnector);
        this.node.appendChild(this.connectors[newConnector]);
    }
    resetProperties() {
        this.properties = {
            color: createProperty('Background Color', 'color', '#ADD8E6'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            setProperty: this.setProperty
        };

        switch (this.type) {
            case 'text':
                this.properties.text = createProperty('Text', 'text', 'Write something here...');
                this.properties.fontSize = createProperty('Font Size', 'number', 1.2);
                this.properties.fontColor = createProperty('Font Color', 'color', '#000000');
                break;
            case 'image':
                this.properties.imageSrc = createProperty('Image Source', 'text', './Assets/ImageIcon.png');
                this.properties.width = createProperty('Image Width', 'number', 25);
                this.properties.height = createProperty('Image Height', 'number', 25);
                break;
        }

        this.properties.addConnector = createProperty('Add Connector', 'Button', this.addConnector);
        this.properties.default = {
            ...this.properties
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
    connectTo = (flowchartIndex, pos2Calculator) => {
        FlowchartItem.connecting = null;

        if (flowchartIndex == this.index)
            this.connectingCurves.splice(this.connectingCurves.length - 1, 1);
        else {
            this.connectingCurves[this.connectingCurves.length - 1].curve.p2 = pos2Calculator;
            this.connectingCurves[this.connectingCurves.length - 1].connected = true;
        }
    }
}

class Curve {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }
    display() {
        const p1 = this.p1();
        const p2 = this.p2();

        line(p1.x, p1.y, p2.x, p2.y);
    }
}