window.addEventListener('load', () => Inspector.node = document.querySelector('.inspector'));

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
        if (Inspector.inspectingProperties == null)
            return;

        const propertyObjContainer = document.querySelector('.inspector > .properties');
        propertyObjContainer.innerHTML = '';
        let propGroup = null;
        for (const property in Inspector.inspectingProperties) {
            const currentProp = Inspector.inspectingProperties[property];

            if (property == 'default' ||
                property == 'setProperty' ||
                property == 'delete' ||
                (!currentProp.multiple &&
                    !currentProp.type.endsWith('header') &&
                    !currentProp.visible))
                continue;

            this.propertyInputs[property] = {};

            const newPropertyContainer = document.createElement('div');

            if (currentProp.name != null && currentProp.name.toString().trim() != '') {
                const propertyLabel = document.createElement('label');
                propertyLabel.textContent = currentProp.name;
                newPropertyContainer.appendChild(propertyLabel);

                this.propertyInputs[property].label = propertyLabel;
            }
            if (!currentProp.multiple && currentProp.type.endsWith('header')){
                propertyObjContainer.appendChild(newPropertyContainer);
                newPropertyContainer.className = 'property-header';
            }
            if (!currentProp.multiple && (currentProp.type.endsWith('header') || propGroup == null)) {
                propGroup = document.createElement('div');
                propGroup.className = 'property-group';
                propertyObjContainer.appendChild(propGroup);
            }

            switch (currentProp.type) {
                case 'header':
                    newPropertyContainer.classList.add('no-flex');
                    const cPropGroup = propGroup;
                    const expandArrow = document.createElement('div');
                    expandArrow.className = 'expandArrow';
                    expandArrow.addEventListener('click', () => {
                        expandArrow.style.transform = expandArrow.style.transform == '' ? 'rotate(-90deg)' : '';
                        cPropGroup.style.display = cPropGroup.style.display == '' ? 'none' : '';
                    });
                    newPropertyContainer.appendChild(expandArrow);
                    break;
                case 'btnheader':
                    newPropertyContainer.classList.add('no-flex');

                    for (let i = 0; i < currentProp.classes.length; i++) {
                        const btn = document.createElement('button');
                        btn.className = currentProp.classes[i];
                        btn.addEventListener('click', currentProp.click);
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
                        const inputChangeHandler = () => {
                            Inspector.propertyChanged(property, input.type == 'checkbox' ? input.checked : input.value, i)
                        };
                        input.type = inpData.type || 'text';

                        if (input.type == 'button')
                            input.addEventListener('click', inpData.val);
                        else if (input.type == 'checkbox')
                            input.checked = inpData.val;
                        else
                            input.value = inpData.val || '';

                        input.innerHTML = currentProp.content == undefined ? '' : currentProp.content;
                        input.className = currentProp.iClass;
                        input.addEventListener('keyup', inputChangeHandler);
                        input.addEventListener('change', inputChangeHandler);
                        newPropertyContainer.appendChild(input);
                        this.propertyInputs[property].input.push(input);
                    }

                    if (currentProp.remF) {
                        const removeBtn = document.createElement("button");
                        removeBtn.className = "removeBtn";
                        removeBtn.addEventListener('click', () => {
                            currentProp.remF(property);
                            newPropertyContainer.remove();
                            delete Inspector.inspectingProperties[property];
                        });
                        newPropertyContainer.appendChild(removeBtn);
                    }
                    break;
            }

            if (currentProp.multiple || !currentProp.type.endsWith('header'))
                propGroup.appendChild(newPropertyContainer);
        }
    },
    refresh(prop) {
        if (this.propertyInputs == null)
            return;

        const propObj = Inspector.inspectingProperties[prop];
        const propInput = this.propertyInputs[prop];
        if (propObj == null || propInput == null)
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
const createProperty = (name, type, value, options = {
    remove: null,
    inputClass: '',
    multiple: false,
    inputContent: '',
    visible: true
}) => {
    const {
        remove,
        inputClass,
        multiple,
        inputContent,
        visible
    } = options;

    return {
        name,
        type,
        val: value,
        remF: remove,
        iClass: inputClass,
        content: inputContent,
        multiple,
        visible
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