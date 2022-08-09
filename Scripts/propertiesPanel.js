window.addEventListener('load', () => PropertiesPanel.node = document.querySelector('#properties-panel'));

const PropertiesPanel = {
    node: null,
    active: false,
    inspectingProperties: null,
    propertyInputs: {},
    activate(val) {
        if (PropertiesPanel.inspectingProperties == null)
            PropertiesPanel.node = document.querySelector('#properties-panel');

        if (val)
            PropertiesPanel.load();

        PropertiesPanel.active = val;
    },
    load() {
        if (PropertiesPanel.inspectingProperties == null)
            return;

        const propertyObjContainer = document.querySelector('#properties-panel > .properties');
        propertyObjContainer.innerHTML = '';
        let propGroup = null;
        for (const property in PropertiesPanel.inspectingProperties) {
            const currentProp = PropertiesPanel.inspectingProperties[property];

            if (!currentProp.visible ||
                property == 'default' ||
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
            if (!currentProp.multiple && currentProp.type.endsWith('header')) {
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
                            { type: currentProp.type[i], val: currentProp.val[i], options: currentProp.options ? currentProp.options[i] : null } :
                            { type: currentProp.type, val: currentProp.val, options: currentProp.options };
                        const input = document.createElement(inpData.type == 'button' ? 'button' :
                            inpData.type == 'select' ? 'select' : 'input');
                        const inputChangeHandler = () => {
                            PropertiesPanel.propertyChanged(property, input.type == 'checkbox' ? input.checked :
                                input.nodeName == 'SELECT' ? input.selectedIndex : input.value, i)
                        };
                        input.type = inpData.type || 'text';

                        if (input.type == 'button')
                            input.addEventListener('click', inpData.val);
                        else if (input.type == 'checkbox')
                            input.checked = inpData.val;
                        else if (inpData.type == 'select') {
                            if (!Array.isArray(inpData.options))
                                console.error('Input value expected to be an array');
                            else {
                                inpData.options.forEach(opt => {
                                    const option = document.createElement('option');
                                    option.setAttribute('value', opt);
                                    option.innerText = opt;
                                    input.appendChild(option);
                                });
                            }
                        }
                        else
                            input.value = inpData.val || '';

                        if (inpData.type != 'select')
                            input.innerHTML = currentProp.content == undefined ? '' : currentProp.content;
                        if (currentProp.iClass)
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
                            delete PropertiesPanel.inspectingProperties[property];
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

        const propObj = PropertiesPanel.inspectingProperties[prop];
        const propInput = this.propertyInputs[prop];
        if (propObj == null || propInput == null)
            return;

        propInput.input.forEach((input, index) => {
            input.value = this.inspectingProperties[prop].val[index];
        });
    },
    resetProperties() {
        PropertiesPanel.inspectingProperties = PropertiesPanel.inspectingProperties.default;
        const inputs = document.querySelector('#properties-panel > .properties');

        let i = -1;
        for (const currentProperty in PropertiesPanel.inspectingProperties) {
            i++;

            const prop = PropertiesPanel.inspectingProperties[currentProperty];

            if (currentProperty == 'setProperty' || currentProperty == 'delete' || prop.type.endsWith('header'))
                continue;

            PropertiesPanel.inspectingProperties.setProperty(currentProperty, propVal);

            const currentInput = inputs.children[i].querySelector('input');
            currentInput.value = currentInput.type == 'button' ? '' : prop.val;
            currentInput.className = prop.iClass == null ? currentInput.type + 'Input' : prop.iClass;
        }

        PropertiesPanel.inspectingProperties.default = {
            ...PropertiesPanel.inspectingProperties
        };
    },
    deleteItem() {
        PropertiesPanel.inspectingProperties.delete();
        PropertiesPanel.activate(false);
        PropertiesPanel.inspectingProperties = null;
    },
    propertyChanged: (name, val, index) => PropertiesPanel.inspectingProperties.setProperty(name, val, index)
};