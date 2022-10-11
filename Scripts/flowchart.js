function updateFlowchartPos() {
    flowchartItems.forEach(item => {
        item.updatePosition();
    });
}

//Base Class
class FlowchartItem {
    constructor(pos, index, addConnectors = true) {
        this.pos = pos;
        this.added = false;
        this.index = index;
        this.connectingCurves = [];
        this.connectedItems = [];
        this.connectors = [];
        this.connectorsVisible = true;
        this.clickEnabled = this.dragEnabled = true;
        this.lastMouseAngle = null;
        this.selected = false;
        this.templateProps = expandPropertySets({
            pos: createDynamicProperty(null, null, () => this.pos, { visible: false }),
            general: BasePropertySets.general
        });

        const itemsContainer = document.querySelector('.flowchartItems');
        const newItem = document.createElement('div');
        const dataContainer = document.createElement('div');
        const selectionCheckbox = document.createElement('input');

        newItem.className = 'flowchartItem';
        newItem.tabIndex = 0;
        newItem.addEventListener('click', this.mouseClicked);
        newItem.addEventListener('keydown', this.keyPressed);
        newItem.style.top = this.pos.y + 'px';
        newItem.style.left = this.pos.x + 'px';

        newItem.draggable = true;
        newItem.ondragenter = newItem.ontouchstart = this.mouseDragStart;
        newItem.ondrag = newItem.ontouchmove = this.mouseDragged;
        newItem.ondragend = newItem.ontouchend = this.mouseDragEnd;

        dataContainer.className = 'dataContainer';

        selectionCheckbox.title = 'Select Item';
        selectionCheckbox.type = 'checkbox';
        selectionCheckbox.className = 'selection-checkbox';
        selectionCheckbox.addEventListener('change', () => {
            this.selected = selectionCheckbox.checked;
            SelectionManager.itemSelectChanged(this);
        });

        newItem.appendChild(selectionCheckbox);
        newItem.appendChild(dataContainer);
        itemsContainer.appendChild(newItem);

        this.node = newItem;
        this.dataContainer = dataContainer;
        this.connectorContainer = this.node;
        this.selectionCheckbox = selectionCheckbox;

        if (addConnectors)
            this.addConnectors();
    }
    scale = () => cellSize / 50 * this.properties.scale.val;
    mouseClicked = () => {
        if (!editingEnabled)
            return;

        if (!this.clickEnabled) {
            this.clickEnabled = true;
            return;
        }

        if (!this.added) {
            this.added = true;

            this.setSelected(true);
            SelectionManager.itemSelectChanged(this);
        }
    }
    mouseDragStart = () => {
        //If editing is not enabled then do not move this item
        dragEnabled = false || !editingEnabled;
        this.dragEnabled = editingEnabled && this.dragEnabled;
    }
    mouseDragged = () => {
        if (!this.dragEnabled)
            return;

        this.moveToMouse();
        this.updatePosition();
    }
    mouseDragEnd = () => {
        dragEnabled = true;
    }
    calculateCurvePos = connectorPos =>
        this.pos.mult(cellSize).add(pos).add(connectorPos.sub(vec(50, 50)).mult(vec(
            this.connectorContainer.offsetWidth / 100,
            this.connectorContainer.offsetHeight / 100
        ).mult(this.scale())));
    connectorClicked = index => {
        this.clickEnabled = false;

        //Error checking
        if (index == null || !this.connectors || !this.connectors.length)
            return;

        //If some other connector is trying to connect then connect to it
        if (FlowchartItem.connecting != null) {
            this.connectingCurves.push(curves.length - 1);
            FlowchartItem.connecting.connectTo(
                this.index,
                () => this.calculateCurvePos(this.connectors[index].pos),
                this.connectors[index].pos
            );
            return;
        }

        //Otherwise make the clicked connector trying to connect and create a curve for it
        let curveIndex = curves.length;
        this.connectingCurves.push(curveIndex);
        curves.push(
            new Curve(
                () => this.calculateCurvePos(this.connectors[index].pos),
                () => vec(mouseX, mouseY),
                false, Encoder.encodeCurve(null, null, this.connectors[index].pos)
            )
        );
        curves[curves.length - 1].i = curveIndex;

        FlowchartItem.connecting = this;
    }
    addConnectors = () => {
        let addConnector = (x, y) => {
            const newConnector = this.connectors.length;
            this.connectors.push(document.createElement('div'));
            this.connectors[newConnector].className = 'connector';
            this.connectors[newConnector].addEventListener('click', () => this.connectorClicked(newConnector));
            this.connectors[newConnector].style = `top:${y * 50}%;left:${x + (y % 2) * -50 + 50}%;`;
            this.connectors[newConnector].pos = vec(x + (y % 2) * -50 + 50, y * 50);
            this.connectorContainer.appendChild(this.connectors[newConnector]);
            return newConnector;
        }

        for (let y = 0; y < 3; y++)
            for (let x = 0; x < ((y % 2) + 1) * 100; x += 100)
                addConnector(x, y);
    }
    update() {
        if (!this.added) {
            this.moveToMouse();
            this.updatePosition();
        }

        if (this.connectorsVisible != editingEnabled) {
            this.connectors.forEach(connector => {
                connector.style.display = editingEnabled ? '' : 'none';
            });
            this.node.draggable = editingEnabled;
            this.connectorsVisible = editingEnabled;
        }

        if ((this.selectionCheckbox.style.display != 'none') != editingEnabled)
            this.selectionCheckbox.style.display = editingEnabled ? '' : 'none';

        this.node.style.transform = `translate(-50%, -50%) scale(${this.scale()})`
            + this.properties.shape == "diamond" ? " rotate(45deg)" : "";
    }
    moveToMouse() {
        const newPos = vector(mouseX - pos.x, mouseY - pos.y).divide(cellSize);
        this.pos = shiftPressed ? newPos.round() : newPos;
    }
    updatePosition() {
        this.node.style.top = this.pos.y * cellSize + pos.y + 'px';
        this.node.style.left = this.pos.x * cellSize + pos.x + 'px';
    }
    connectTo = (flowchartIndex, pos2Calculator, connectorPos) => {
        const curveIndex = this.connectingCurves[this.connectingCurves.length - 1];

        if (flowchartIndex == this.index) {
            let remIndex = null;
            curves.forEach((curve, index) => {
                if (curve.i == curveIndex) {
                    remIndex = index;
                    return true;
                }
            });

            if (remIndex != null)
                curves.splice(remIndex, 1);
            this.connectingCurves.splice(this.connectingCurves.length - 1, 1);
        }
        else {
            curves[curveIndex].p1f = pos2Calculator;
            curves[curveIndex].fixed = true;
            Encoder.changeCurveData(curves[curveIndex].data, this.index, flowchartIndex, null, connectorPos, curves[curveIndex].straight);
        }

        FlowchartItem.connecting = null;
    }
    delete = () => {
        for (let i = 0; i < curves.length; i++) {
            if (this.connectingCurves.length == 0)
                break;

            if (curves[i].i == this.connectingCurves[0]) {
                curves.splice(this.connectingCurves.shift(), 1);
                i--;
            }
        }

        PropertiesPanel.activate(false);
        flowchartItems.splice(this.index, 1);
        this.node.remove();
    }
    setProperty = (property, val, index) => {
        if (property == null || !this.properties[property] || property == 'setProperty'
            || property == 'default' || property == 'delete')
            return;

        if (this.templateProps[property])
            switch (property) {
                case 'color':
                    this.node.style.backgroundColor = val;
                    break;
                case 'shape':
                    this.node.setAttribute('shape', this.properties.shape.options[val]);
                    break;
                case 'pos':
                    this.pos = val;
                    break;
                case 'scale':
                    this.update();
                    break;
                case 'borderColor':
                    this.node.style.setProperty('--border-color', val);
                    break;
                case 'cornerRadius':
                    this.node.style.borderRadius = val + 'vmin';
                    break;
            }

        if (this.properties[property].visible) {
            if (this.properties[property].multiple) {
                if (index != null) {
                    if (!this.properties[property].type[index].endsWith('header') && this.properties[property].type != 'select')
                        this.properties[property].val[index] = val;
                }
                else
                    this.properties[property].val = val;
            }
            else if (!this.properties[property].type.endsWith('header') && this.properties[property].type != 'select')
                this.properties[property].val = val;
        }

        this.updateProperty(property, val, index);
    }
    touches(rectangle) {
        this.collider = new Rectangle(this.node.offsetLeft, this.node.offsetTop, this.node.offsetWidth, this.node.offsetHeight, vec(.5, .5));
        return this.collider.touches(rectangle);
    }
    setSelected = val => {
        this.selected = val;
        this.selectionCheckbox.checked = val;
    }
}

//Primitive
class FlowchartTextBox extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('div');
        this.dataContainer.appendChild(this.innerNode);

        this.resetProperties();
    }
    updateProperty = (property, val) => {
        switch (property) {
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
            ...this.templateProps,
            head1: createPropertyHeader('Text'),
            text: createProperty('Text', 'text', 'Write something here...'),
            fontSize: createProperty('Font Size', 'number', 1.2),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            setProperty: this.setProperty,
            delete: this.delete
        };

        this.properties.default = {
            ...this.properties,
            dontEncode: true
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
            case 'width':
                this.innerNode.style.width = val + 'px';
                break;
            case 'height':
                this.innerNode.style.height = val + 'px';
                break;
            case 'imageSrc':
                this.innerNode.setAttribute('src', val);
                break;
            case 'padding':
                this.innerNode.style.setProperty('--padding', val);
                break;
        }
    }
    resetProperties() {
        this.properties = {
            ...this.templateProps,
            head1: createPropertyHeader('Image'),
            imageSrc: createProperty('Image Source', 'text', './Assets/ImageIcon.png'),
            width: createProperty('Image Width', 'number', 100),
            height: createProperty('Image Height', 'number', 80),
            padding: createProperty('Padding', 'number', 2),
            setProperty: this.setProperty,
            delete: this.delete
        };

        this.properties.default = {
            ...this.properties,
            dontEncode: true
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
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

        this.resetProperties();

        for (let i = 0; i < 3; i++)
            this.addItem();
    }
    updateProperty = (property, val) => {
        switch (property) {
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
            ...this.templateProps,
            head1: createPropertyHeader('List'),
            fontSize: createProperty('Font Size', 'number', 1.4),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            head2: createPropertyBtnHeader('Items', ['addBtn'], this.addItem),
            setProperty: this.setProperty,
            delete: this.delete
        };

        this.properties.default = {
            ...this.properties,
            dontEncode: true
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

        this.properties[propName] = createProperty(null, 'text', 'Item ' + itemIndex, {
            remove: n => this.removeItem(this.properties[n].index),
            inputClass: 'long'
        });
        this.properties[propName].index = itemIndex

        PropertiesPanel.load();
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
class FlowchartLink extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index);

        this.innerNode = document.createElement('a');
        this.dataContainer.appendChild(this.innerNode);

        this.resetProperties();
    }
    updateProperty = (property, val) => {
        switch (property) {
            case 'text':
                this.innerNode.textContent = val;
                break;
            case 'fontColor':
                this.innerNode.style.color = val;
                break;
            case 'fontSize':
                this.innerNode.style.fontSize = val + 'vw';
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
            ...this.templateProps,
            head1: createPropertyHeader('Link'),
            text: createProperty('Text', 'text', 'Open Google'),
            link: createProperty('Link', 'text', 'https://google.com'),
            fontSize: createProperty('Font Size', 'number', 1.2),
            fontColor: createProperty('Font Color', 'color', '#000000'),
            underline: createProperty('Underline Link', 'checkbox', false),
            setProperty: this.setProperty,
            delete: this.delete
        };

        this.properties.default = {
            ...this.properties,
            dontEncode: true
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
}

//Complicated
class FlowchartBarGraph extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index, false);

        this.header = document.createElement('div');
        this.header.className = 'bargraph-header';
        this.node.className = 'bargraph';
        this.node.appendChild(this.header);
        this.connectorContainer = this.header;

        this.resetProperties();
        this.addConnectors();

        //Removing the top connector
        this.connectors[0].remove();
        this.connectors[0] = undefined;

        this.bars = [];
        for (let i = 0; i < 3; i++)
            this.addNewBar();
    }
    calculateCurvePos = connectorPos =>
        this.pos.mult(cellSize).add(pos).add(connectorPos.sub(vec(50, 50)).mult(vec(
            this.header.offsetWidth / 100,
            this.header.offsetHeight / 100
        )).mult(this.scale()).add(vec(0, this.dataContainer.offsetHeight / 2 * this.scale())));
    scale = () => cellSize / 50 * this.properties.scale.val;
    updateProperty = (property, val, index) => {
        switch (property) {
            case 'header':
                this.header.textContent = val;
                break;
            case 'headerBG':
                this.header.style.backgroundColor = val;
                break;
            case 'headerColor':
                this.header.style.color = val;
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
            ...this.templateProps,
            head1: createPropertyHeader('Header'),
            header: createProperty('Header Content', 'text', 'New Bar Graph'),
            headerBG: createProperty('Header Background', 'color', '#2f4f4f'),
            headerColor: createProperty('Header Font Color', 'color', '#FFFFFF'),
            head2: createPropertyBtnHeader('Bars', ['addBtn'], this.addNewBar),
            setProperty: this.setProperty,
            delete: this.delete
        };
        delete this.properties.color;
        delete this.properties.shape;
        delete this.properties.borderColor;
        delete this.properties.cornerRadius;

        this.properties.default = {
            ...this.properties,
            dontEncode: true
        };

        for (const prop in this.properties)
            this.setProperty(prop, this.properties[prop].val);
    }
    barScalerDragStarted = () => {
        dragEnabled = false;
        this.dragEnabled = false;
        this.lastDragY = mouseY;
    }
    barScalerDragEnded = () => {
        dragEnabled = true;
        this.dragEnabled = true;
        this.lastDragY = null;
    }
    barScalerDragged = barIndex => {
        const d = this.lastDragY - mouseY;
        const h = parseFloat(this.bars[barIndex].style.height.slice(0, this.bars[barIndex].style.height.length - 2));
        const newH = h + d / this.scale();

        this.bars[barIndex].style.height = newH + 'px';
        this.lastDragY = mouseY;

        this.properties[this.bars[barIndex].propName].val[1] = Math.round(newH);
        PropertiesPanel.refresh(this.bars[barIndex].propName);
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
                multiple: true
            }),
            index: i
        }

        this.header.style.height = Math.min(Math.max(1.5, .5 * i + .5), 3) + 'rem';
        PropertiesPanel.load();
    }
    removeBar = i => {
        const prop = this.properties[i];
        for (const p in this.properties)
            if (this.properties[p] != null && this.properties[p].index > prop.index)
                this.properties[p].index--;
        this.properties[i] = null;

        this.bars[prop.index].remove();
        this.bars.splice(prop.index, 1);
        this.header.style.height = Math.min(Math.max(1.5, .5 * this.bars.length - 1 + .5), 3) + 'rem';
    }
}
class FlowchartPieChart extends FlowchartItem {
    constructor(pos, index) {
        super(pos, index, false);

        this.node.classList.add('transparent')
        this.dataContainer.className = 'piechart';
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.sectionNames = document.createElement('div');
        this.dataContainer.style.width = this.size + 'px';
        this.dataContainer.style.height = this.size + 'px';
        this.dataContainer.appendChild(this.svg);
        this.connectorContainer = this.dataContainer;
        this.node.appendChild(this.sectionNames);
        this.node.style.setProperty('--border-color', 'none');
        this.sections = [];
        this.resizerDragging = null;

        this.resetProperties();

        for (let i = 0; i < 3; i++)
            this.addSection(false);

        this.updateSVG();
        this.addConnectors();

        this.connectors[3].remove();
        this.connectors[3] = undefined;

        this.collider = new Rectangle(0, 0, this.node.offsetWidth, this.node.offsetHeight);
    }
    scale = () => cellSize / 50 * this.properties.scale.val;
    updateProperty = (property, val, i) => {
        switch (property) {
            case 'fontColor':
                this.sections.forEach(section => section.name.style.color = val);
            case 'stroke':
                this.sections.forEach(section => section.setAttribute("stroke", val));
                break;
            case 'strokeWeight':
                this.sections.forEach(section => section.setAttribute("stroke-width", val));
                this.updateSize();
                this.updateSVG();
                break;
            default:
                if (property.startsWith('sec')) {
                    const index = this.properties[property].index;

                    if (i != null) {
                        switch (i) {
                            case 0:
                                this.sections[index].name.textContent = val;
                                break;
                            case 1: this.sections[index].size = parseFloat(val) || 0;
                                break;
                            case 2:
                                this.sections[index].color = val;
                                this.sections[index].name.style.backgroundColor = val;
                                break;
                        }
                    }
                    else {
                        this.sections[index].name.textContent = val[0];
                        this.sections[index].size = val[1];
                        this.sections[index].color = val[2];
                        this.sections[index].name.style.backgroundColor = val[2];
                    }

                    this.updateSVG();
                }
                break;
        }
    }
    resetProperties() {
        this.properties = {
            ...this.templateProps,
            head1: createPropertyHeader('Style'),
            fontColor: createProperty('Font Color', 'color', '#FFFFFF'),
            randomFill: createProperty('Radomize Section Colors', 'button', this.fillRandomColors, {
                inputContent: '<img src="./Assets/Shuffle.svg" alt="Randomize Section Colors"/>',
                inputClass: 'randomizeBtn'
            }),
            stroke: createProperty('Stroke Color', 'color', '#FFFFFF'),
            strokeWeight: createProperty('Stroke Weight', 'number', '3'),
            head2: createPropertyBtnHeader('Sections', ['addBtn'], this.addSection),
            setProperty: this.setProperty,
            delete: this.delete
        };
        delete this.properties.shape;
        delete this.properties.borderColor;
        delete this.properties.cornerRadius;

        this.properties.default = {
            ...this.properties,
            dontEncode: true
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

        this.properties[propName] = createProperty(
            null, ['text', 'number', 'color'],
            [newSection.text, 1, newSection.color],
            { multiple: true, visible: true, remove: this.removeSection }
        );
        this.properties[propName].index = index;

        PropertiesPanel.load();

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
            PropertiesPanel.refresh(this.sections[i].propName);
        }

        this.updateSVG();
    }
}