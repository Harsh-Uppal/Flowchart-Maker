class Inspector {
    static activate(val) {
        if (this.node == null)
            this.node = document.querySelector('.inspector');

        if (val)
            this.loadProperties();

        this.node.style.marginTop = val ? '0' : '100%';
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
        for (let property in this.inspectingProperties) {

            if (property == 'default')
                continue;

            let newPropertyContainer = document.createElement('div');
            let propertyLabel = document.createElement('label');
            let input = document.createElement('input');

            newPropertyContainer.id = this.numProperties++;
            propertyLabel.textContent = this.inspectingProperties[property].name;
            input.type = this.inspectingProperties[property].type || 'text';
            input.value = this.inspectingProperties[property].val || '';
            input.className = input.type + 'Input';

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
            const currentInput = inputs.children[i].querySelector('input');
            currentInput.value = this.inspectingProperties[currentProperty].val;
            i++;
        }

        this.inspectingProperties.default = { ...this.inspectingProperties };
    }
}

function createProperty(name, type, value) {
    return { name: name, type: type, val: value };
}