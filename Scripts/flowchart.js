class FlowchartItem {
    constructor(pos, index) {
        this.pos = pos;
        this.added = false;
        this.newConnector = null;
        this.index = index;
        this.connectingCurves = [];
        this.connectedItems = [];
        this.connectors = [];
        this.clickEnabled = true;
        this.lastMouseAngle = null;

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
        this.dragger.ondragenter = this.dragger.ontouchstart = this.mouseDragStart;
        this.dragger.ondrag = this.dragger.ontouchmove = this.mouseDragged;
        this.dragger.ondragend = this.dragger.ontouchend = this.mouseDragEnd;
        
        dataContainer.className = 'dataContainer';
        dataContainer.appendChild(this.dragger);

        newItem.appendChild(dataContainer);
        itemsContainer.appendChild(newItem);

        this.node = newItem;
        this.dataContainer = dataContainer;
        this.connectorContainer = this.node;
    }
    scale = () => cellSize / 50;
    keyPressed = key => {
        if (key.key == 'Delete') this.delete();
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
        this.moveToMouse();
        this.updatePosition();
    }
    mouseDragEnd = () => {
        dragEnabled = true;
    }
    calculateConnectorPos = connectorAngle => vector(
        100 + connectorAngle % 100 - 50,
        100 - Math.abs(connectorAngle)
    );
    calculateCurvePos = connectorRot =>
        this.pos.mult(cellSize).add(pos).add(this.calculateConnectorPos(connectorRot).sub(vector(50, 50)).mult(vector(
            this.connectorContainer.offsetWidth / 100,
            this.connectorContainer.offsetHeight / 100
        ).mult(this.scale())));
    connectorClicked = index => {
        this.clickEnabled = false;
        //If some other connector is trying to connect then connect to it
        if (FlowchartItem.connecting != null) {
            FlowchartItem.connecting.connectTo(this.index,
                 () => this.calculateCurvePos(this.connectors[index].rotation)
            );
            return;
        }

        //Error checking
        if (index == null || this.connectors == null || this.connectors.length == 0)
            return;

        if (this.connectingCurves.length > 0 && !this.connectingCurves[this.connectingCurves.length - 1].connected)
            this.connectingCurves.splice(this.connectingCurves.length - 1, 1);

        //If a new connector is clicked then add it
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

        //Otherwise make the clicked connector trying to connect and create a curve for it
        this.connectingCurves.push({
            curve: curve(
                () => this.calculateCurvePos(this.connectors[index].rotation),
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
        this.connectorContainer.appendChild(this.connectors[newConnector]);
    }
    update() {
        if (!this.added) {
            this.moveToMouse();
            this.updatePosition();
        }

        this.node.style.transform = `translate(-50%, -50%) scale(${this.scale()})`;

        this.connectingCurves.forEach(({
            curve
        }) => {
            drawCurve(curve);
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
    moveToMouse() {
        const newPos = vector(mouseX - pos.x, mouseY - pos.y).divide(cellSize);
        this.pos = shiftPressed ? newPos.round() : newPos;
    }
    updatePosition() {
        this.node.style.top = this.pos.y * cellSize + pos.y + 'px';
        this.node.style.left = this.pos.x * cellSize + pos.x + 'px';
    }
    connectTo = (flowchartIndex, pos2Calculator) => {
        FlowchartItem.connecting = null;

        if (flowchartIndex == this.index)
            this.connectingCurves.splice(this.connectingCurves.length - 1, 1);
        else {
            this.connectingCurves[this.connectingCurves.length - 1].curve.p2f = pos2Calculator;
            this.connectingCurves[this.connectingCurves.length - 1].connected = true;
        }
    }
    delete = () => {
        Inspector.activate(false);
        flowchartItems.splice(this.index, 1);
        this.node.remove();
    }
    setProperty = (property, val) => {
        if (property != null && property != 'setProperty' && property != 'default' && property != 'delete') {
            if (!this.properties[property].type.endsWith('header'))
                this.properties[property].val = val;

            this.updateProperty(property, val);
        }
    }
}
class FlowchartTextBox extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('div');
        this.innerNode.className = 'text';
        this.dataContainer.appendChild(this.innerNode);

        this.resetProperties();
    }
    updateProperty = (property, val) => {
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
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {inputClass:'addBtn'}),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('Text'),
            text: createProperty('Text', 'text', 'Write something here...'),
            fontSize: createProperty('Font Size', 'number', 1.2),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            setProperty: this.setProperty,
            delete: this.delete
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
    updateProperty = (property, val) => {
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
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {inputClass:'addBtn'}),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('Image'),
            imageSrc: createProperty('Image Source', 'text', './Assets/ImageIcon.png'),
            width: createProperty('Image Width', 'number', 100),
            height: createProperty('Image Height', 'number', 80),
            setProperty: this.setProperty,
            delete: this.delete
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
        const barBtns = document.createElement('div');
        barBtns.className = 'barBtns';

        const addBarBtn = document.createElement('button');
        addBarBtn.innerText = '+';
        addBarBtn.title = 'Add a new bar';
        addBarBtn.onclick = this.addNewBar;

        const removeBarBtn = document.createElement('button');
        removeBarBtn.innerText = '-';
        removeBarBtn.title = 'Remove the last bar';
        removeBarBtn.onclick = this.removeBar;

        barBtns.appendChild(addBarBtn);
        barBtns.appendChild(removeBarBtn);

        this.dragger.appendChild(this.header);
        this.dragger.appendChild(barBtns);

        this.node.appendChild(this.dragger);
        this.connectorContainer = this.dragger;

        this.resetProperties();

        this.bars = [];

        for (let i = 0; i < 3; i++)
            this.addNewBar();
    }
    calculateCurvePos = connectorRot =>
        this.pos.mult(cellSize).add(pos).add(this.calculateConnectorPos(connectorRot).sub(vector(50, 50)).mult(vector(
            this.dragger.offsetWidth / 100,
            this.dragger.offsetHeight / 100
        )).mult(this.scale()).add(vector(0, this.dataContainer.offsetHeight / 2 * this.scale())));
    scale = () => cellSize / 50 * this.properties.scale.val;
    updateProperty = (property, val) => {
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
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {inputClass:'addBtn'}),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head3: createPropertyHeader('Bars'),
            setProperty: this.setProperty,
            delete: this.delete
        };

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
        this.bars[barIndex].style.height = currentBarHeight + dragDiff / this.scale() + 'px';

        this.lastDragY = mouseY;
    }
    addNewBar = () => {
        const i = this.bars.length;
        const newBar = document.createElement('div');
        const barScaler = document.createElement('div');
        const newBarContent = document.createElement('div');

        barScaler.ondragstart = barScaler.ontouchstart = this.barScalerDragStarted;
        barScaler.ondrag = barScaler.ontouchmove = () => this.barScalerDragged(i);
        barScaler.ondragend = barScaler.ontouchend = this.barScalerDragEnded;
        barScaler.draggable = true;
        barScaler.className = 'barScaler';

        newBarContent.className = 'barDataRotator';
        newBarContent.textContent = 'Bar ' + i;
        newBar.style.height = 60 + (20 * i) + 'px';

        newBar.appendChild(barScaler);
        newBar.appendChild(newBarContent);

        newBar.content = newBarContent;

        this.dataContainer.appendChild(newBar);
        this.bars.push(newBar);

        this.properties['bar' + i] = createProperty(null, 'text', 'Bar ' + i, {
            remove: alert,
            inputClass: 'transparentInput'
        });

        this.dragger.style.height = Math.min(Math.max(1.5, .5 * i + .5), 3) + 'rem';
    }
    removeBar = () => {
        this.bars[this.bars.length - 1].remove();
        this.bars.splice(this.bars.length - 1, 1);
        this.properties['bar' + this.bars.length] = null;
        this.dragger.style.height = Math.min(Math.max(1.5, .5 * this.bars.length - 1 + .5), 3) + 'rem';
    }
}
class FlowchartList extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('div');
        this.items = [];
        this.dataContainer.appendChild(this.innerNode);
        this.listNode = document.createElement('ul');
        this.listNode.className = 'flowchartList';
        this.dataContainer.appendChild(this.listNode);
        this.headingContainer = document.createElement('div');
        this.headingContainer.className = 'listHeading';
        this.dragger.appendChild(this.headingContainer);

        const listBtnContainer = document.createElement('div');
        listBtnContainer.className = 'listBtns';
        const addItemBtn = document.createElement('button');
        const removeItemBtn = document.createElement('button');

        addItemBtn.textContent = '+';
        addItemBtn.onclick = this.addItem;
        removeItemBtn.textContent = '-';
        removeItemBtn.onclick = this.removeItem;

        listBtnContainer.appendChild(addItemBtn);
        listBtnContainer.appendChild(removeItemBtn);
        this.dragger.appendChild(listBtnContainer);

        this.resetProperties();

        for (let i = 0; i < 3; i++)
            this.addItem();
    }
    updateProperty = (property, val) => {
        switch (property) {
            case 'color':
                this.node.style.backgroundColor = val;
                break;
            case 'heading':
                this.headingContainer.textContent = val;
                break;
            case 'headColor':
                this.dragger.style.backgroundColor = val;
                break;
            case 'headFontColor':
                this.headingContainer.style.color = val;
                break;
            case 'fontColor':
                this.listNode.style.color = val;
                break;
            case 'fontSize':
                this.listNode.style.fontSize = val + 'vw';
                break;
        }

        if (property.startsWith('item')) {
            const itemNum = parseInt(property.slice(4, property.length));
            this.items[itemNum].innerText = val;
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            color: createProperty('Background Color', 'color', '#ADD8E6'),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {
                inputClass: 'addBtn'
            }),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', 'New List'),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('List'),
            fontSize: createProperty('Font Size', 'number', 1.4),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            head3: createPropertyBtnHeader('Items', ['addBtn'], this.addItem),
            setProperty: this.setProperty,
            delete: this.delete
        };

        this.properties.default = {
            ...this.properties
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
    addItem = () => {
        const itemIndex = this.items.length;
        const newItem = document.createElement('li');
        newItem.innerText = 'Item ' + itemIndex;

        this.listNode.appendChild(newItem);
        this.items.push(newItem);

        this.properties['item' + itemIndex] = createProperty(null, 'text', 'Item ' + itemIndex, {
            remove: n => this.removeItem(this.properties[n].index),
            inputClass: 'transparentInput'
        });
        this.properties['item' + itemIndex].index = itemIndex;

        Inspector.loadProperties();
    }
    removeItem = index => {
        index = index != null ? Math.min(index, this.items.length - 1) : this.items.length - 1;
        this.items[index].remove();
        this.items.splice(index, 1);
        delete this.properties['item' + this.items.length];
    }
}
class FlowchartPieChart extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.node.classList.add('transparent')
        this.dataContainer.className = 'piechart';
        this.dragger.className = 'piechartDragger';
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.sectionContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.sectionContainer.setAttribute('width', '100%');
        this.sectionContainer.setAttribute('height', '100%');
        this.svg.appendChild(this.sectionContainer);
        this.size = 200;
        this.half_size = this.size / 2;
        this.dataContainer.style.width = this.size + 'px';
        this.dataContainer.style.height = this.size + 'px';
        this.dataContainer.appendChild(this.svg);
        this.sections = [];
        this.resizerDragging = null;

        this.resetProperties();

        for (let i = 0; i < 4; i++)
            this.addSection(false);

        this.updateSVG();
    }
    scale = () => cellSize / 50 * this.properties.scale.val;
    updateProperty = (property, val) => {
        switch (property) {
            case 'color':
                this.dragger.style.backgroundColor = val;
                break;
            case 'scale':
                this.update();
                break;
            case 'stroke':
                this.sections.forEach(section => section.setAttribute("stroke", val));
                break;
            case 'bgColor':
                this.sections.forEach(section => section.setAttribute("fill", val));
                break;
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            scale: createProperty('Scale', 'number', 1),
            color: createProperty('Color', 'color', '#20B2AA'),
            stroke: createProperty('Stroke Color', 'color', '#FFFFFF'),
            bgColor: createProperty('Background Color', 'color', '#000000'),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {inputClass:'addBtn'}),
            head2: createPropertyHeader('Sections'),
            setProperty: this.setProperty,
            delete: this.delete
        };

        this.properties.default = {
            ...this.properties
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
    updateSVG() {
        let startAngle = this.sections[this.sections.length - 1].angle;
        this.sections.forEach((section, ind) => {
            const startP = vector(-Math.sin(startAngle), -Math.cos(startAngle)).mult(this.half_size - 5).add(this.half_size);
            const endP = vector(-Math.sin(section.angle), -Math.cos(section.angle)).mult(this.half_size - 5).add(this.half_size);
            section.setAttribute('d', `M ${this.half_size} ${this.half_size} L ${startP.x}  ${startP.y} ` +
                `A ${this.half_size} ${this.half_size} 0 0 0 ${endP.x} ${endP.y} L ${this.half_size} ${this.half_size}`);
            section.resizer.setAttribute('cx', endP.x);
            section.resizer.setAttribute('cy', endP.y);

            startAngle = section.angle;
        });
    }
    addSection(update = true) {
        const index = this.sections.length;
        const newSection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        newSection.setAttribute("stroke", "white");
        newSection.setAttribute("stroke-width", "5px");
        newSection.angle = Math.PI * 2;
        newSection.resizer = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        newSection.resizer.setAttribute('fill', 'cyan');
        newSection.resizer.setAttribute('class', 'resizer');
        newSection.resizer.setAttribute('r', 5);
        newSection.resizer.addEventListener('mousedown', () => this.resizerDragStart(index));
        newSection.resizer.addEventListener('mousemove', this.resizerMouseMove);
        newSection.resizer.addEventListener('mouseup', this.resizerDragEnd);
        newSection.resizer.addEventListener('mouseleave', this.resizerDragEnd);
        newSection.resizer.addEventListener('touchstart', () => this.resizerDragStart(index));
        newSection.resizer.addEventListener('touchmove', this.resizerMouseMove);
        newSection.resizer.addEventListener('touchend', this.resizerDragEnd);
        newSection.resizer.addEventListener('touchleave', this.resizerDragEnd);
        newSection.resizer.addEventListener('touchcancel', this.resizerDragEnd);

        this.sections.push(newSection);
        this.sectionContainer.appendChild(newSection);
        this.svg.appendChild(newSection.resizer);

        for(let i = 0;i < index;i ++)
            this.sections[i].angle -= Math.PI / (index + 2);

        if (update)
            this.updateSVG();
    }
    resizerDragStart = index => {
        this.resizerDragging = index;
    }
    resizerMouseMove = () => {
        if(this.resizerDragging == null)
            return;

        const angle = Math.atan2(mouseX - this.pos.x * cellSize - pos.x, mouseY - this.pos.y * cellSize - pos.y);
        const sizeInc = 0;
        console.log(this.sections[this.resizerDragging].startAngle * 180 / Math.PI);

        this.sections.sum = this.section.sum + sizeInc;
    }
    resizerDragEnd = () => {
        this.resizerDragging = null;
    }
}