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

            if (property == 'default' || property == 'setProperty' || property == 'delete')
                continue;

            const currentProp = this.inspectingProperties[property];
            const newPropertyContainer = document.createElement('div');

            newPropertyContainer.id = this.numProperties++;

            if (currentProp.name != null && currentProp.name.toString().trim() != '') {
                const propertyLabel = document.createElement('label');
                propertyLabel.textContent = currentProp.name;
                propertyLabel.className = currentProp.type.endsWith('header') ? 'inspectorHeader' : '';
                newPropertyContainer.appendChild(propertyLabel);
            }

            switch (currentProp.type) {
                case 'header':
                    newPropertyContainer.classList.add('no-flex');
                    const seperator = document.createElement('hr');
                    newPropertyContainer.appendChild(seperator);
                    break;
                case 'btnheader':
                    newPropertyContainer.classList.add('no-flex');

                    for (let i = 0; i < currentProp.classes.length; i++) {
                        const btn = document.createElement('button');
                        btn.classList = currentProp.classes[i];
                        btn.onclick = currentProp.click;
                        newPropertyContainer.appendChild(btn);
                    }
                    break;
                default:
                    const input = document.createElement(currentProp.type.toLowerCase() == 'button' ? 'button' : 'input');

                    input.type = currentProp.type || 'text';

                    if (input.type.toLowerCase() == 'button')
                        input.onclick = currentProp.val;

                    input.value = input.type.toLowerCase() == 'button' ? '' : currentProp.val || '';
                    input.className = currentProp.iClass == null ? input.type + 'Input' : currentProp.iClass;
                    input.onkeyup = input.onchange =
                        () => {
                            Inspector.propertyChanged(property, input.value)
                        };
                    newPropertyContainer.appendChild(input);

                    if (currentProp.remF) {
                        const removeBtn = document.createElement("button");
                        removeBtn.className = "removeBtn";
                        removeBtn.onclick = () => {
                            currentProp.remF(property);
                            newPropertyContainer.remove();
                            delete Inspector.inspectingProperties[property];
                        };
                        newPropertyContainer.appendChild(removeBtn);
                    }

                    break;
            }

            propertyObjContainer.appendChild(newPropertyContainer);
        }
    }
    static resetProperties() {
        this.inspectingProperties = this.inspectingProperties.default;
        const inputs = document.querySelector('.inspector > .properties');

        let i = -1;
        for (const currentProperty in this.inspectingProperties) {
            i++;

            const prop = this.inspectingProperties[currentProperty];

            if (currentProperty == 'setProperty' || currentProperty == 'delete' || prop.type.endsWith('header'))
                continue;

            this.inspectingProperties.setProperty(currentProperty, propVal);

            const currentInput = inputs.children[i].querySelector('input');
            currentInput.value = currentInput.type == 'button' ? '' : prop.val;
            currentInput.className = prop.iClass == null ? currentInput.type + 'Input' : prop.iClass;
        }

        this.inspectingProperties.default = {
            ...this.inspectingProperties
        };
    }
    static deleteItem() {
        this.inspectingProperties.delete();
        this.activate(false);
        this.inspectingProperties = null;
    }
    static propertyChanged(name, val) {
        this.inspectingProperties.setProperty(name, val);
    }
}

const createProperty = (name, type, value, options) => {
    const {
        remove,
        inputClass
    } = options != null ? options : [null];

    return {
        name: name,
        type: type,
        val: value,
        remF: remove,
        iClass: inputClass
    }
};

const createPropertyHeader = header => ({
    name: header,
    type: 'header'
});

const createPropertyBtnHeader = (header, btnClassList, onclick) => ({
    name: header,
    type: 'btnheader',
    classes: btnClassList,
    click: onclick
});