class FlowchartItem {
    constructor(type, pos, index) {
        this.pos = pos;
        this.type = type;
        this.added = false;
        this.connectors = [];
        this.newConnector = null;
        this.connected = false;
        this.index = index;
        this.connectors = [];
        this.lastMouseAngle = vector(Infinity, Infinity);

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
    connectorClicked = (index) => {
        if (index == null || this.connectors == null || this.connectors.length == 0)
            return;

        if (index === this.newConnector)
            this.newConnector = null;

    }
    update() {
        if (!this.added)
            this.pos = vector(mouseX - pos.x, mouseY - pos.y).divide(cellSize);

        this.node.style.transform = `translate(-50%, -50%) scale(${cellSize / 50 * this.properties.scale.val})`;
        this.updatePosition();

        if(this.newConnector != null){
            const dirVec = vector(mouseX, mouseY).sub(this.pos.mult(cellSize));
            const angle = Math.atan2(dirVec.x, dirVec.y);
            const roundedAngle = Math.round(angle / (Math.PI / 2)) * 50;
            
            if(roundedAngle != this.lastMouseAngle)
            {
                this.lastMouseAngle = roundedAngle;

                this.connectors[this.newConnector].style.top = 100 - Math.abs(roundedAngle) + '%';
                this.connectors[this.newConnector].style.left = 100 + roundedAngle % 100 - 50 + '%';

                console.log(roundedAngle);
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
            case 'scale':
                if (val == 0) {
                    flowchartItems.splice(this.index, 1);
                    Inspector.activate(false);
                    Inspector.setInspectorProperties(null);
                }
                this.update();
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

        this.newConnector = this.connectors.length;
        this.connectors.push(document.createElement('div'));
        this.connectors[this.newConnector].className = 'connector temp';
        this.connectors[this.newConnector].onclick = () => this.connectorClicked(this.newConnector);
        this.node.appendChild(this.connectors[this.newConnector]);
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
                this.properties.fontSize = createProperty('Font Size', 'number', 1.2);
                this.properties.fontColor = createProperty('Font Color', 'color', '#000000');
                break;
            case 'image':
                this.properties.imageSrc = createProperty('Image Source', 'text', './Assets/ImageIcon.png');
                break;
        }

        this.properties.addConnector = createProperty('Add Connector', 'Button', this.addConnector);
        this.properties.default = { ...this.properties };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
}