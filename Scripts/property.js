const { createProperty, createDynamicProperty, createPropertyHeader, createPropertyBtnHeader } =
    (() => {
        let nextId = 0;
        return {
            createProperty: (name, type, value, options = {
                remove: null,
                inputClass: '',
                multiple: false,
                inputContent: '',
                visible: true,
                id: []
            }) => {
                try {
                    type = type.toLowerCase();
                } catch { }
                const {
                    remove,
                    inputClass,
                    multiple,
                    inputContent,
                    visible
                } = options;

                id = options.id || [];
                id.push(nextId++);

                return {
                    name,
                    type,
                    val: type == 'select' ? 0 : value,
                    options: type == 'select' ? value : null,
                    remF: type == 'select' ? undefined : remove,
                    iClass: inputClass,
                    content: inputContent,
                    multiple,
                    visible: isNaN(visible) ? true : visible,
                    id
                }
            },
            createDynamicProperty: (name, type, valueFn, options = {
                remove: null,
                inputClass: '',
                multiple: false,
                inputContent: '',
                visible: true,
                id: []
            }) => {
                try {
                    type = type.toLowerCase();
                } catch { }
                const {
                    remove,
                    inputClass,
                    multiple,
                    inputContent,
                    visible
                } = options;

                id = options.id || [];
                id.push(nextId++);

                return type == 'select' ? null : {
                    name,
                    type,
                    get val() {
                        return valueFn();
                    },
                    remF: remove,
                    iClass: inputClass,
                    content: inputContent,
                    multiple,
                    visible: visible,
                    id
                }
            },
            createPropertyHeader: header => ({
                name: header,
                type: 'header',
                visible: true,
                id: nextId++
            }),
            createPropertyBtnHeader: (header, btnClassList, onclick) => ({
                name: header,
                type: 'btnheader',
                classes: btnClassList,
                click: onclick,
                visible: true,
                id: nextId++
            })
        }
    })();
const createPropertySet = (() => {
    return (header, properties) => ({
        type: 'property-set',
        header,
        properties,
        headerProp: createPropertyHeader(header)
    });
})();
const expandPropertySets = properties => {
    for (const property in properties) {
        if (Object.hasOwnProperty.call(properties, property)) {
            const propVal = properties[property];

            if (propVal.type == 'property-set') {
                for (const prop in propVal.properties) {
                    if (Object.hasOwnProperty.call(propVal.properties, prop)) {
                        properties[prop] = propVal.properties[prop];
                    }
                }

                properties[property] = propVal.headerProp;
            }
        }
    }

    return properties;
};