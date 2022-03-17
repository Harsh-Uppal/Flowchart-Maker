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
                    if (currentProp.multiple &&
                        (!Array.isArray(currentProp.type) ||
                            !Array.isArray(currentProp.val) ||
                            currentProp.type.length != currentProp.val.length))
                        break;

                    //Number of loops
                    const l =  currentProp.multiple ? currentProp.type.length : 1;
                    for (let i = 0; i < l; i++) {
                        const inpData = currentProp.multiple ?
                            { type: currentProp.type[i].toLowerCase(), val: currentProp.val[i] } :
                            { type: currentProp.type.toLowerCase(), val: currentProp.val };
                        const input = document.createElement(inpData.type == 'button' ? 'button' : 'input');

                        input.type = inpData.type || 'text';

                        if (input.type == 'button')
                            input.onclick = inpData.val;
                        else if (input.type == 'checkbox')
                            input.checked = inpData.val;
                        else
                            input.value = inpData.val || '';

                        input.className = currentProp.iClass == null ? input.type + 'Input' : currentProp.iClass;
                        input.onkeyup = input.onchange =
                            () => {
                                Inspector.propertyChanged(property, input.type == 'checkbox' ? input.checked : input.value, i)
                            };
                        newPropertyContainer.appendChild(input);
                    }

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
    static propertyChanged = (name, val, index) => this.inspectingProperties.setProperty(name, val, index);
}

const createProperty = (name, type, value, options) => {
    const {
        remove,
        inputClass,
        multiple
    } = options != null ? options : {};

    return {
        name: name,
        type: type,
        val: value,
        remF: remove,
        iClass: inputClass,
        multiple: multiple
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