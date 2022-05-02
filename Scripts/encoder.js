function saveFlowchart() {
    const blob = new Blob([Encoder.encodeFlowchart()], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a"); // Or maybe get it from the current document
    link.href = URL.createObjectURL(blob);
    link.download = "flowchart.flc";
    link.click();
}

const createEncoder = () => {
    const encodeArray = arr => `[${(function () {
        let str = '';
        for (let i = 0; i < arr.length; i++)
            str += arr[i] + ',';
        return str;
    })()}]`;
    const encodeItem = (item) => {
        let str = '';
        for (const prop in item.properties) {
            const obj = item.properties[prop];
            if (!(obj.dontEncode ||
                (typeof (obj) == 'function') ||
                (typeof (obj.val) == 'function') ||
                (!obj.multiple && obj.type.endsWith('header'))))
                str += `${prop}:${obj.multiple ? encodeArray(obj.val) : 
                    (obj.type || 'text') == 'text' ? `"${obj.val}"` : obj.val},`;
        }
        return `${item.constructor.name}:{${str.toString().replace(' ', String.fromCharCode(0))}},`;
    }
    const decodeItem = item => {
        return (Function('return new ' + item + '();'))();
    }

    return {
        encodeFlowchart: () => {
            if (!Array.isArray(flowchartItems) || flowchartItems.length == 0)
                return '';

            let str = '';
            flowchartItems.forEach((item) => {
                str += encodeItem(item);
            });
            return `{${str}}`;
        }
    };
}

const Encoder = createEncoder();