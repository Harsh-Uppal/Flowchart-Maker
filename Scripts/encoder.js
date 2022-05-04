function saveFlowchart() {
    const blob = new Blob([Encoder.encodeFlowchart()], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "flowchart.flc";
    link.click();
}

function loadFlowchart() {
    let inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.flc';
    inp.addEventListener('change', async() => {
        console.log(JSON.parse(await inp.files[0].text()));
    });
    inp.click();
}

const Encoder = (() => {
    const encodeItem = (item) => {
        let itemObj = {type:item.constructor.name, properties:{}};
        for (const prop in item.properties) {
            const obj = item.properties[prop];
            if (!(obj.dontEncode ||
                (typeof (obj) == 'function') ||
                (typeof (obj.val) == 'function') ||
                (obj.type && obj.type.endsWith('header'))))
                itemObj.properties[prop] = obj.val;
        }
        return itemObj;
    }
    const decodeItem = item => {
        return (Function('return new ' + item + '();'))();
    }

    return {
        encodeFlowchart: () => {
            if (!Array.isArray(flowchartItems) || flowchartItems.length == 0)
                return '';

            let obj = {generalProperties:null, flowchartItems:[]};
            flowchartItems.forEach((item) => {
                obj.flowchartItems.push(encodeItem(item));
            });
            return JSON.stringify(obj);
        }
    };
})();