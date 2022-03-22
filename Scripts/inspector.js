window.onload = () => Inspector.node = document.querySelector('.inspector');

const Inspector = {
    node: null,
    active: false,
    inspectingProperties: null,
    propertyInputs: {},
    activate(val) {
        if (Inspector.inspectingProperties == null)
            Inspector.node = document.querySelector('.inspector');

        if (val) {
            Inspector.load();
            Inspector.node.style.display = '';
        } else
            Inspector.noDisplayTimeout = setTimeout(() => {
                Inspector.node.style.display = 'none'
            }, 1000);
        Inspector.node.style.bottom = val ? '4vh' : '-100vh';
        Inspector.active = val;
    },
    load() {
        // console.log(Inspector.inspectingProperties)

        if (Inspector.inspectingProperties == null)
            return;

        const propertyObjContainer = document.querySelector('.inspector > .properties');
        propertyObjContainer.innerHTML = '';
        Inspector.numProperties = 0;
        for (const property in Inspector.inspectingProperties) {

            if (property == 'default' || property == 'setProperty' || property == 'delete')
                continue;

            this.propertyInputs[property] = {};

            const currentProp = Inspector.inspectingProperties[property];
            const newPropertyContainer = document.createElement('div');

            newPropertyContainer.id = Inspector.numProperties++;

            if (currentProp.name != null && currentProp.name.toString().trim() != '') {
                const propertyLabel = document.createElement('label');
                propertyLabel.textContent = currentProp.name;
                propertyLabel.className = currentProp.type.endsWith('header') ? 'inspectorHeader' : '';
                newPropertyContainer.appendChild(propertyLabel);

                this.propertyInputs[property].label = propertyLabel;
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

                    this.propertyInputs[property].input = [];

                    //Number of loops
                    const l = currentProp.multiple ? currentProp.type.length : 1;
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

                        input.innerHTML = currentProp.content == undefined ? '' : currentProp.content;
                        input.className = currentProp.iClass;
                        input.onkeyup = input.onchange =
                            () => {
                                Inspector.propertyChanged(property, input.type == 'checkbox' ? input.checked : input.value, i)
                            };
                        newPropertyContainer.appendChild(input);
                        this.propertyInputs[property].input.push(input);
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
    },
    refresh(prop) {
        if(this.propertyInputs == null)
            return;

        const propObj = Inspector.inspectingProperties[prop];
        const propInput = this.propertyInputs[prop];
        if(propObj == null || propInput == null)
            return;
            
        propInput.input.forEach((input, index) => {
            input.value = this.inspectingProperties[prop].val[index];
        });
    },
    resetProperties() {
        Inspector.inspectingProperties = Inspector.inspectingProperties.default;
        const inputs = document.querySelector('.inspector > .properties');

        let i = -1;
        for (const currentProperty in Inspector.inspectingProperties) {
            i++;

            const prop = Inspector.inspectingProperties[currentProperty];

            if (currentProperty == 'setProperty' || currentProperty == 'delete' || prop.type.endsWith('header'))
                continue;

            Inspector.inspectingProperties.setProperty(currentProperty, propVal);

            const currentInput = inputs.children[i].querySelector('input');
            currentInput.value = currentInput.type == 'button' ? '' : prop.val;
            currentInput.className = prop.iClass == null ? currentInput.type + 'Input' : prop.iClass;
        }

        Inspector.inspectingProperties.default = {
            ...Inspector.inspectingProperties
        };
    },
    deleteItem() {
        Inspector.inspectingProperties.delete();
        Inspector.activate(false);
        Inspector.inspectingProperties = null;
    },
    propertyChanged: (name, val, index) => Inspector.inspectingProperties.setProperty(name, val, index)
};
const createProperty = (name, type, value, options) => {
    const {
        remove,
        inputClass,
        multiple,
        inputContent
    } = options != null ? options : {};

    return {
        name: name,
        type: type,
        val: value,
        remF: remove,
        iClass: inputClass,
        multiple: multiple,
        content: inputContent
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