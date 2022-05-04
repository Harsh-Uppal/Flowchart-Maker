const createProperty = (name, type, value, options = {
    remove: null,
    inputClass: '',
    multiple: false,
    inputContent: '',
    visible: true
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
    return type == 'select' ? {
        name,
        type,
        val: 0,
        options: value,
        remF: remove,
        iClass: inputClass,
        content: inputContent,
        multiple,
        visible: visible
    } : {
        name,
        type,
        val: value,
        remF: remove,
        iClass: inputClass,
        content: inputContent,
        multiple,
        visible: visible
    }
};
const createDynamicProperty = (name, type, valueFn, options = {
    remove: null,
    inputClass: '',
    multiple: false,
    inputContent: '',
    visible: true}) => {
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
        visible: visible
    }
}
const createPropertyHeader = header => ({
    name: header,
    type: 'header',
    visible: true
});
const createPropertyBtnHeader = (header, btnClassList, onclick) => ({
    name: header,
    type: 'btnheader',
    classes: btnClassList,
    click: onclick,
    visible: true
});