class Inspector {
    static activate(val) {
        if (this.node == null)
            this.node = document.querySelector('.inspector');

        if(val)
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
        
        let propertyObjContainer = document.querySelector('.inspector > .properties');
        for(let property in this.inspectingProperties){
            let newPropertyContainer = document.createElement('div');
            let propertyLabel = document.createElement('label');
            let input = document.createElement('input');

            propertyLabel.textContent = property.name;
            input.type = property.type;
            input.value = property.val;

            newPropertyContainer.appendChild(propertyLabel);
            newPropertyContainer.appendChild(input);

            propertyObjContainer.appendChild(newPropertyContainer);
        }
    }
}

function createProperty(name, type, value) {
    return { name:name, type: type, val: value };
}