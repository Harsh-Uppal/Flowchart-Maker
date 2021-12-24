class Inspector {
    static activate(val) {
        if (this.node == null)
            this.node = document.querySelector('.inspector');

        if (val)
            this.loadProperties();

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

            let newPropertyContainer = document.createElement('div');
            let propertyLabel = document.createElement('label');
            let input = document.createElement('input');

            newPropertyContainer.id = this.numProperties++;
            propertyLabel.textContent = currentProp.name;

            input.type = currentProp.type || 'text';
            input.value = currentProp.val || '';
            input.className = input.type + 'Input';
            input.onkeyup =
                input.onchange = () => { Inspector.propertyChanged(property, input.value) };

            newPropertyContainer.appendChild(propertyLabel);
            newPropertyContainer.appendChild(input);

            propertyObjContainer.appendChild(newPropertyContainer);
        }
    }
    static saveProperties() {
        alert('Properties Saved');
    }
    static resetProperties() {
        this.inspectingProperties = this.inspectingProperties.default;
        const inputs = document.querySelector('.inspector > .properties');

        let i = 0;
        for (const currentProperty in this.inspectingProperties) {
            if (currentProperty == 'setProperty')
                continue;

            const currentInput = inputs.children[i].querySelector('input');
            currentInput.value = this.inspectingProperties[currentProperty].val;
            i++;
        }

        this.inspectingProperties.default = { ...this.inspectingProperties };
    }
    static propertyChanged(name, val) {
        this.inspectingProperties.setProperty(name, val);
    }
}

function createProperty(name, type, value) {
    return { name: name, type: type, val: value };
}