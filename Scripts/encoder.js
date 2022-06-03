function saveFlowchart() {
    if (!Array.isArray(flowchartItems) || flowchartItems.length == 0) {
        alert('Cannot save an empty flowchart');
        console.error('Cannot save an empty flowchart');
        return;
    }

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
    inp.addEventListener('change', async () => {
        Encoder.loadFlowchart(JSON.parse(await inp.files[0].text()));
    });
    inp.click();
}

const Encoder = {
    encodeFlowchart: () => {
        const encodeItem = (item) => {
            let itemObj = { type: item.constructor.name, properties: {} };
            for (const prop in item.properties) {
                const obj = item.properties[prop];
                if (obj.multiple || !(obj.dontEncode ||
                    (typeof (obj) == 'function') ||
                    (typeof (obj.val) == 'function') ||
                    (obj.type && obj.type.endsWith('header'))))
                    itemObj.properties[prop] = obj.val;
            }
            return itemObj;
        }

        let obj = { pos: pos, curves: [], general: {}, flowchartItems: [] };
        curves.forEach(curve => {
            if (curve.fixed)
                obj.curves.push(curve.data);
        });
        for (const generalInput in generalInputs) {
            if (Object.hasOwnProperty.call(generalInputs, generalInput)) {
                const inputElem = generalInputs[generalInput];
                obj.general[generalInput] = { value: inputElem.value, type: inputElem.type };
            }
        }
        flowchartItems.forEach((item) => {
            obj.flowchartItems.push(encodeItem(item));
        });
        return JSON.stringify(obj);
    },
    loadFlowchart: (data) => {
        if (data.pos)
            pos = vec(data.pos.x, data.pos.y);

        for (const general in data.general) {
            if (Object.hasOwnProperty.call(data.general, general)) {
                const generalVal = data.general[general];
                if (generalInputs[general] == null)
                    continue;

                if (generalVal.type)
                    generalInputs[general].type = generalVal.type;
                if (generalVal.value)
                    generalInputs[general].value = generalVal.value;

                generalInputs[general].dispatchEvent(new Event("change"));
            }
        }

        if (Array.isArray(data.flowchartItems))
            for (let i = 0; i < data.flowchartItems.length; i++) {
                const index = flowchartItems.length;
                const item = data.flowchartItems[i];
                flowchartItems.push((Function(`return new ${item.type}(vec(0, 0), ${index});`))());
                flowchartItems[index].added = true;
                if (item.properties)
                    for (const property in item.properties) {
                        if (Object.hasOwnProperty.call(item.properties, property)) {
                            const prop = item.properties[property];

                            if (prop.x && prop.y)
                                flowchartItems[index].setProperty(property, vec(prop.x, prop.y));
                            else if (prop.multiple)
                                for (let g = 0; g < prop.length; g++)
                                    flowchartItems[index].setProperty(property, prop[g], g);
                            else
                                flowchartItems[index].setProperty(property, prop);
                        }
                    }
            }

        if (Array.isArray(data.curves))
            data.curves.forEach(curve => {
                curves.push(Encoder.decodeCurve(curve));
            });

        update();
        updateFlowchartPos();
    },
    encodeCurve: (flowchartItem0Index, flowchartItem1Index, connectorPos0, connectorPos1, isCurveStraight) =>
        [flowchartItem0Index, flowchartItem1Index, connectorPos0, connectorPos1, isCurveStraight],
    decodeCurve: (curveData) => {
        return new Curve(
            () => flowchartItems[curveData[0]].calculateCurvePos(vec(curveData[2].x, curveData[2].y)),
            () => flowchartItems[curveData[1]].calculateCurvePos(vec(curveData[3].x, curveData[3].y)),
            true, curveData, curveData[4]
        );
    },
    changeCurveData: (data, flowchartItem0Index, flowchartItem1Index, connectorPos0, connectorPos1, isCurveStraight) => {
        data[0] = flowchartItem0Index ?? data[0];
        data[1] = flowchartItem1Index ?? data[1];
        data[2] = connectorPos0 ?? data[2];
        data[3] = connectorPos1 ?? data[3];
        data[4] = isCurveStraight ?? data[4];
    }
}