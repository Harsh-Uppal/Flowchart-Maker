class Inspector {
    static activate(val) {
        if (this.node == null)
            this.node = document.querySelector('.inspector');

        this.node.style.marginTop = val ? '0' : '100%';
        this.active = val;

        if(val)
            this.loadProperties();
    }
    static setInspectorProperties(props) {
        this.inspectingProperties = props;
    }
    static loadProperties() {
        if (this.inspectingProperties == null)
            return;
        
        let propertyObjContainer = document.querySelector('.inspector > .properties');
        console.log(propertyObjContainer);
        for(let property in this.inspectingProperties){

        }
    }
}

function createProperty(type, value) {
    return { type: type, val: value };
}