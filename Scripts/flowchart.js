class FlowchartItem {
    constructor(pos, index) {
        this.pos = pos;
        this.added = false;
        this.newConnector = null;
        this.index = index;
        this.connectingCurves = [];
        this.connectors = [];
        this.clickEnabled = true;
        this.lastMouseAngle = vector(Infinity, Infinity);

        const itemsContainer = document.querySelector('.flowchartItems');
        const newItem = document.createElement('div');
        const dataContainer = document.createElement('div');
        this.dragger = document.createElement('div');

        newItem.className = 'flowchartItem';
        newItem.tabIndex = 0;
        newItem.onclick = this.mouseClicked;
        newItem.onkeydown = this.keyPressed;
        newItem.style.top = this.pos.y + 'px';
        newItem.style.left = this.pos.x + 'px';

        this.dragger.className = 'dragger';
        this.dragger.draggable = true;
        this.dragger.ondragenter = this.mouseDragStart;
        this.dragger.ondrag = this.mouseDragged;
        this.dragger.ondragend = this.mouseDragEnd;

        dataContainer.className = 'dataContainer';
        dataContainer.appendChild(this.dragger);

        newItem.appendChild(dataContainer);
        itemsContainer.appendChild(newItem);

        this.node = newItem;
        this.dataContainer = dataContainer;
    }
    scale = () => cellSize / 50;
    keyPressed = key => {
        if (key.key == 'Delete') {
            Inspector.activate(false);
            flowchartItems.splice(this.index, 1);
            this.node.remove();
        }
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
    addConnector = () => {
        Inspector.activate(false);

        const newConnector = this.connectors.length;
        this.newConnector = newConnector;
        this.connectors.push(document.createElement('div'));
        this.connectors[newConnector].className = 'connector temp';
        this.connectors[newConnector].onclick = () => this.connectorClicked(newConnector);
        this.node.appendChild(this.connectors[newConnector]);
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
class FlowchartTextBox extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('div');
        this.innerNode.innerText = 'Write something here...';
        this.innerNode.className = 'text';
        this.dataContainer.appendChild(this.innerNode);

        this.resetProperties();
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
                this.dragger.textContent = val;
                break;
            case 'headColor':
                this.dragger.style.backgroundColor = val;
                break;
            case 'headFontColor':
                this.dragger.style.color = val;
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
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            color: createProperty('Background Color', 'color', '#ADD8E6'),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('Text'),
            text: createProperty('Text', 'text', 'Write something here...'),
            fontSize: createProperty('Font Size', 'number', 1.2),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            head3: createPropertyHeader('Connectors'),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector),
            setProperty: this.setProperty
        };

        this.properties.default = {
            ...this.properties
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
}
class FlowchartImage extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('img');
        this.innerNode.setAttribute('src', './Assets/ImageIcon.png');
        this.innerNode.className = 'image';
        this.dataContainer.appendChild(this.innerNode);

        this.resetProperties();
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
                this.dragger.textContent = val;
                break;
            case 'headColor':
                this.dragger.style.backgroundColor = val;
                break;
            case 'headFontColor':
                this.dragger.style.color = val;
                break;
            case 'width':
                this.innerNode.style.width = val + 'px';
                break;
            case 'height':
                this.innerNode.style.height = val + 'px';
                break;
            case 'imageSrc':
                this.innerNode.setAttribute('src', val);
                break;
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            color: createProperty('Background Color', 'color', '#ADD8E6'),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('Image'),
            imageSrc: createProperty('Image Source', 'text', './Assets/ImageIcon.png'),
            width: createProperty('Image Width', 'number', 100),
            height: createProperty('Image Height', 'number', 80),
            head3: createPropertyHeader('Connectors'),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector),
            setProperty: this.setProperty
        };

        this.properties.default = {
            ...this.properties
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
}
class FlowchartBarGraph extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.header = document.createElement('div');
        this.node.className = 'BarGraph';
        this.dragger.className = 'bottomBar';
        const addBarBtn = document.createElement('button');
        addBarBtn.className = 'addBarBtn';
        addBarBtn.innerText = '+';
        addBarBtn.onclick = this.addNewBar;
        this.dragger.appendChild(this.header);
        this.dragger.appendChild(addBarBtn);

        this.node.appendChild(this.dragger);

        this.resetProperties();

        this.bars = [];

        for (let i = 0; i < 3; i++)
            this.addNewBar();
    }
    scale = () => cellSize / 50 * this.properties.scale.val;
    setProperty = (property, val) => {
        if (property == 'setProperty' || property == 'default')
            return;

        const propertyObj = this.properties[property];
        this.properties[property] = createProperty(propertyObj.name, propertyObj.type, val, propertyObj.options);
        switch (property) {
            case 'heading':
                this.header.innerText = val;
                break;
            case 'headColor':
                this.dragger.style.backgroundColor = val;
                break;
            case 'headFontColor':
                this.dragger.style.color = val;
                break;
            case 'scale':
                this.update();
                break;
            default:
                if (property.startsWith('bar')) {
                    const barIndex = parseInt(property.slice(3, property.length));
                    this.bars[barIndex].content.textContent = val;
                }
                break;
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            scale: createProperty('Scale', 'number', 1),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('Connectors'),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector),
            head3: createPropertyHeader('Bars'),
            setProperty: this.setProperty
        };

        // for(const bar in this.bars)
        //     this.properties['bar' + bar] = createProperty('Bar ' + bar, 'text', 'Bar ' + bar);

        this.properties.default = {
            ...this.properties
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
    barScalerDragStarted = () => {
        dragEnabled = false;
        this.lastDragY = mouseY;
    }
    barScalerDragEnded = () => {
        dragEnabled = true;
        this.lastDragY = null;
    }
    barScalerDragged = barIndex => {
        const dragDiff = this.lastDragY - mouseY;

        const currentBarHeight = parseFloat(this.bars[barIndex].style.height.slice(0, this.bars[barIndex].style.height.length - 2));
        this.bars[barIndex].style.height = currentBarHeight + dragDiff + 'px';

        this.lastDragY = mouseY;
    }
    addNewBar = () => {
        const i = this.bars.length;
        const newBar = document.createElement('div');
        const barScaler = document.createElement('div');
        const newBarContent = document.createElement('div');

        barScaler.ondragstart = this.barScalerDragStarted;
        barScaler.ondrag = () => this.barScalerDragged(i);
        barScaler.ondragend = this.barScalerDragEnded;
        barScaler.draggable = true;
        barScaler.className = 'barScaler';

        newBarContent.className = 'barDataRotator';
        newBarContent.textContent = 'Bar ' + i;
        newBar.style.height = 40 + (20 * i) + 'px';

        newBar.appendChild(barScaler);
        newBar.appendChild(newBarContent);

        newBar.content = newBarContent;

        this.dataContainer.appendChild(newBar);
        this.bars.push(newBar);

        this.properties['bar' + i] = createProperty('Bar ' + i, 'text', 'Bar ' + i);
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