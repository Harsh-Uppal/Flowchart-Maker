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

        Inspector.inspectingProperties = this.properties;
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
        this.connectingCurves.push(
            new Curve(
                () => this.calculateCurvePos(this.connectors[index].rotation),
                () => vector(mouseX, mouseY),
                false
            )
        );

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

        this.connectingCurves.forEach((curve) => {
            curve.draw();
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
            this.connectingCurves[this.connectingCurves.length - 1].p1f = pos2Calculator;
            this.connectingCurves[this.connectingCurves.length - 1].fixed = true;
        }
    }
    delete = () => {
        Inspector.activate(false);
        flowchartItems.splice(this.index, 1);
        this.node.remove();
    }
    setProperty = (property, val, index) => {
        if (property != null && property != 'setProperty' && property != 'default' && property != 'delete') {
            if (this.properties[property].multiple) {
                if (!this.properties[property].type[index].endsWith('header'))
                    this.properties[property].val[index] = val;
            }
            else if (!this.properties[property].type.endsWith('header'))
                this.properties[property].val = val;

            this.updateProperty(property, val, index);
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
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {
                inputClass: 'addBtn'
            }),
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
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {
                inputClass: 'addBtn'
            }),
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
    updateProperty = (property, val, index) => {
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
                const barIndex = this.properties[property].index;
                if (index == 0 && property.startsWith('bar')) {
                    this.bars[barIndex].content.textContent = val;
                } else if (index == 1)
                    this.bars[barIndex].style.height = val / this.scale() + 'px';
                break;
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            scale: createProperty('Scale', 'number', 1),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {
                inputClass: 'addBtn'
            }),
            head1: createPropertyHeader('Header'),
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head3: createPropertyBtnHeader('Bars', ['addBtn'], this.addNewBar),
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
        const d = this.lastDragY - mouseY;
        const h = parseFloat(this.bars[barIndex].style.height.slice(0, this.bars[barIndex].style.height.length - 2));
        const newH = h + d / this.scale();

        this.bars[barIndex].style.height = newH + 'px';
        this.lastDragY = mouseY;

        this.properties[this.bars[barIndex].propName].val[1] = newH;
        Inspector.refresh(this.bars[barIndex].propName);
    }
    addNewBar = () => {
        let nameI = 0;
        while (this.properties['bar' + nameI] != null)
            nameI++;

        const propName = 'bar' + nameI;
        const i = this.bars.length;
        const newBar = document.createElement('div');
        const barScaler = document.createElement('div');
        const newBarContent = document.createElement('div');
        const barHeight = 60 + (20 * i);

        barScaler.ondragstart = barScaler.ontouchstart = this.barScalerDragStarted;
        barScaler.ondrag = barScaler.ontouchmove = () => this.barScalerDragged(this.properties[propName].index);
        barScaler.ondragend = barScaler.ontouchend = this.barScalerDragEnded;
        barScaler.draggable = true;
        barScaler.className = 'barScaler';

        newBarContent.className = 'barDataRotator';
        newBarContent.textContent = 'Bar ' + i;
        newBar.style.height = barHeight + 'px';
        newBar.propName = propName;

        newBar.appendChild(barScaler);
        newBar.appendChild(newBarContent);

        newBar.content = newBarContent;

        this.dataContainer.appendChild(newBar);
        this.bars.push(newBar);

        this.properties[propName] = {
            ...createProperty(null, ['text', 'number'], ['Bar ' + i, barHeight], {
                remove: this.removeBar,
                inputClass: 'transparentInput',
                multiple: true
            }),
            index: i
        }

        this.dragger.style.height = Math.min(Math.max(1.5, .5 * i + .5), 3) + 'rem';
        Inspector.load();
    }
    removeBar = i => {
        const prop = this.properties[i];
        for (const p in this.properties)
            if (this.properties[p] != null && this.properties[p].index > prop.index)
                this.properties[p].index--;
        this.properties[i] = null;

        this.bars[prop.index].remove();
        this.bars.splice(prop.index, 1);
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
        let nameI = 0;
        while (this.properties['item' + nameI] != null)
            nameI++;

        const propName = 'item' + nameI;
        const itemIndex = this.items.length;
        const newItem = document.createElement('li');
        newItem.innerText = 'Item ' + itemIndex;

        this.listNode.appendChild(newItem);
        this.items.push(newItem);

        this.properties[propName] = {
            ...createProperty(null, 'text', 'Item ' + itemIndex, {
                remove: n => this.removeItem(this.properties[n].index),
                inputClass: 'transparentInput'
            }),
            index: itemIndex
        };

        Inspector.load();
    }
    removeItem = index => {
        this.items[index].remove();
        for (const p in this.properties)
            if (this.properties[p] != null && this.properties[p].index > index)
                this.properties[p].index--;
        this.items.splice(index, 1);
        delete this.properties['item' + index];
    }
}
class FlowchartPieChart extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.node.classList.add('transparent')
        this.dataContainer.className = 'piechart';
        this.dragger.className = 'piechartDragger';
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.sectionNames = document.createElement('div');
        this.dataContainer.style.width = this.size + 'px';
        this.dataContainer.style.height = this.size + 'px';
        this.dataContainer.appendChild(this.svg);
        this.node.appendChild(this.sectionNames);
        this.sections = [];
        this.resizerDragging = null;

        this.resetProperties();

        for (let i = 0; i < 3; i++)
            this.addSection(false);

        this.updateSVG();
    }
    scale = () => cellSize / 50 * this.properties.scale.val;
    updateProperty = (property, val, i) => {
        switch (property) {
            case 'color':
                this.dragger.style.backgroundColor = val;
                break;
            case 'fontColor':
                this.sections.forEach(section => section.name.style.color = val);
            case 'scale':
                this.update();
                break;
            case 'stroke':
                this.sections.forEach(section => section.setAttribute("stroke", val));
                break;
            case 'fill':
                this.sections.forEach(section => section.setAttribute("fill", val));
                break;
            case 'strokeWeight':
                this.sections.forEach(section => section.setAttribute("stroke-width", val));
                this.updateSize();
                this.updateSVG();
                break;
            default:
                if (property.startsWith('sec')) {
                    const index = this.properties[property].index;

                    switch (i) {
                        case 0:
                            this.sections[index].name.textContent = val;
                            break;
                        case 1: this.sections[index].size = parseFloat(val) || 0;
                            break;
                        case 2: this.sections[index].color = val;
                            break;
                    }

                    this.updateSVG();
                }
                break;
        }
    }
    resetProperties() {
        this.properties = {
            head0: createPropertyHeader('General'),
            scale: createProperty('Scale', 'number', 1),
            addConnector: createProperty('Add Connector', 'Button', this.addConnector, {
                inputClass: 'addBtn'
            }),
            head1: createPropertyHeader('Style'),
            color: createProperty('Color', 'color', '#20B2AA'),
            fontColor: createProperty('Font Color', 'color', '#FFFFFF'),
            randomFill: createProperty('Radomize Section Colors', 'button', this.fillRandomColors, {
                inputContent: '<img src="./Assets/Shuffle.svg" alt="Randomize Section Colors"/>',
                inputClass: 'randomizeBtn'
            }),
            fill: createProperty('Background Color', 'color', '#000000'),
            stroke: createProperty('Stroke Color', 'color', '#FFFFFF'),
            strokeWeight: createProperty('Stroke Weight', 'number', '3'),
            head2: createPropertyBtnHeader('Sections', ['addBtn'], this.addSection),
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
        let accum = 0, fromAngle, toAngle, fromCoordX, fromCoordY,
            toCoordX, toCoordY, d, totalSize = 0;

        this.sections.forEach(s => totalSize += s.size);
        this.sections.forEach(section => {
            fromAngle = accum;
            accum += section.size / totalSize * (Math.PI * 2);
            toAngle = accum;

            fromCoordX = this.center + this.r * Math.cos(fromAngle);
            fromCoordY = this.center + this.r * Math.sin(fromAngle);
            toCoordX = this.center + this.r * Math.cos(toAngle);
            toCoordY = this.center + this.r * Math.sin(toAngle);

            //d = 'M' + this.center + ',' + this.center + ' L' + fromCoordX + ',' + fromCoordY + ' A' + this.r + ',' + this.r + ' 0 0,1 ' + toCoordX + ',' + toCoordY + 'z';
            d = `M${this.center},${this.center} L${fromCoordX},${fromCoordY} A${this.r},${this.r} 0 ${toAngle - fromAngle > Math.PI ? 1 : 0},1 ${toCoordX},${toCoordY}z`
            section.setAttributeNS(null, "d", d);
            section.setAttribute('fill', section.color);
        });
    }
    updateSize() {
        this.size = 200;
        this.r = this.size / 2;
        this.center = this.size / 2 + (parseInt(this.properties.strokeWeight.val) || 0);
        this.svg.setAttribute('width', this.center * 2 + 'px');
        this.svg.setAttribute('height', this.center * 2 + 'px');
    }
    addSection = (update = true) => {
        let nameI = 0;
        while (this.properties['sec' + nameI] != null)
            nameI++;

        const index = this.sections.length;
        const newSection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const sectionName = document.createElement('div');
        const propName = 'sec' + nameI;

        newSection.propName = propName;
        newSection.name = sectionName;
        newSection.setAttribute("stroke", this.properties.stroke.val);
        newSection.setAttribute("stroke-width", this.properties.strokeWeight.val + 'px');
        newSection.size = 1;
        newSection.color = randomColor();
        newSection.classList = 'piechart-section';

        sectionName.className = 'piechart-section-name';
        sectionName.textContent = newSection.title = newSection.text = 'Section ' + (index + 1);
        sectionName.style.backgroundColor = newSection.color;

        this.svg.appendChild(newSection);
        this.sectionNames.appendChild(sectionName);
        this.sections.push(newSection);

        this.properties[propName] = {
            ...createProperty(
                null,
                ['text', 'number', 'color'],
                [newSection.text, 1, newSection.color],
                { multiple: true, remove: this.removeSection }),
            index
        }
        Inspector.load();

        if (update)
            this.updateSVG();
    }
    removeSection = i => {
        const prop = this.properties[i];
        for (const p in this.properties)
            if (this.properties[p] != null && this.properties[p].index > prop.index)
                this.properties[p].index--;
        this.properties[i] = null;
        this.sections[prop.index].remove();
        this.sections[prop.index].name.remove();
        this.sections.splice(prop.index, 1);
        this.updateSVG();
    }
    fillRandomColors = () => {
        for (let i = 0; i < this.sections.length; i++) {
            this.properties[this.sections[i].propName].val[2] = this.sections[i].color = this.sections[i].name.style.backgroundColor = randomColor();
            Inspector.refresh(this.sections[i].propName);
        }

        this.updateSVG();
    }
}
class FlowchartLink extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('a');
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
            case 'link':
                this.innerNode.href = val;
                break;
            case 'underline':
                if (val)
                    this.innerNode.classList.remove('no-underline');
                else
                    this.innerNode.classList.add('no-underline');
                break;
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
            heading: createProperty('Heading', 'text', ''),
            headColor: createProperty('Heading Background', 'color', '#20B2AA'),
            headFontColor: createProperty('Heading Color', 'color', '#000000'),
            head2: createPropertyHeader('Link'),
            text: createProperty('Text', 'text', 'Write something here...'),
            link: createProperty('Link', 'text', 'https://google.com'),
            fontSize: createProperty('Font Size', 'number', 1.2),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            underline: createProperty('Underline Link', 'checkbox', false),
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

const randomColor = () => {
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16)
    return color.length == 7 ? color : color + '0';
}