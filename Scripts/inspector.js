class Inspector {
    static activate(val) {
        if (this.node == null)
            this.node = document.querySelector('.inspector');

        if (val) {
            this.loadProperties();
            this.node.style.display = '';
        } else
            this.noDisplayTimeout = setTimeout(() => {
                this.node.style.display = 'none'
            }, 1000);
        this.node.style.bottom = val ? '4vh' : '-100vh';
        this.active = val;
    }
    static setInspectorProperties(props) {
        this.inspectingProperties = props;
    }
    static loadProperties() {
        if (this.inspectingProperties == null)
            return;

        const propertyObjContainer = document.querySelector('.inspector > .properties');
        propertyObjContainer.innerHTML = '';
        this.numProperties = 0;
        for (const property in this.inspectingProperties) {

            if (property == 'default' || property == 'setProperty')
                continue;

            const currentProp = this.inspectingProperties[property];
            const newPropertyContainer = document.createElement('div');
            const propertyLabel = document.createElement('label');

            newPropertyContainer.id = this.numProperties++;
            newPropertyContainer.className = currentProp.spClass;
            propertyLabel.textContent = currentProp.name;
            newPropertyContainer.appendChild(propertyLabel);

            switch (currentProp.type) {
                case 'header':
                    propertyLabel.className = 'inspectorHeader';
                    newPropertyContainer.classList.add('no-flex');
                    const seperator = document.createElement('hr');
                    newPropertyContainer.appendChild(seperator);
                    break;
                case 'btnHeader':
                    propertyLabel.className = 'inspectorHeader';
                    newPropertyContainer.classList.add('no-flex');
                    const btn = document.createElement('button');
                    btn.textContent = currentProp.content;
                    btn.onclick = currentProp.click;
                    newPropertyContainer.appendChild(btn);
                    break;
                default:
                    const input = document.createElement('input');

                    input.type = currentProp.type || 'text';

                    if (input.type.toLowerCase() == 'button')
                        input.onclick = currentProp.val;

                    input.value = input.type.toLowerCase() == 'button' ? '+' : currentProp.val || '';
                    input.className = input.type + 'Input';
                    input.onkeyup = input.onchange =
                        () => {
                            Inspector.propertyChanged(property, input.value)
                        };

                    newPropertyContainer.appendChild(input);
                    break;
            }

            propertyObjContainer.appendChild(newPropertyContainer);
        }
    }
    static resetProperties() {
        this.inspectingProperties = this.inspectingProperties.default;
        const inputs = document.querySelector('.inspector > .properties');

        let i = 0;
        for (const currentProperty in this.inspectingProperties) {
            if (currentProperty == 'setProperty')
                continue;

            const propVal = this.inspectingProperties[currentProperty].val;

            this.inspectingProperties.setProperty(currentProperty, propVal);

            const currentInput = inputs.children[i].querySelector('input');
            currentInput.value = currentInput.type == 'button' ? '+' : propVal;
            i++;
        }

        this.inspectingProperties.default = {
            ...this.inspectingProperties
        };
    }
    static propertyChanged(name, val) {
        this.inspectingProperties.setProperty(name, val);
    }
}

const createProperty = (name, type, value, spClass) => ({
    name: name,
    type: type,
    val: value,
    spClass: spClass
});

const createPropertyHeader = header => ({
    name: header,
    type: 'header'
});

const createPropertyBtnHeader = (header, btnContent, onclick) => ({
    name: header,
    type: 'btnHeader',
    content: btnContent,
    click: onclick
});