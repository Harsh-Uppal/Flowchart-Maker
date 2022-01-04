function vector(x, y) {
    return { 
        x: x,
        y: y,
        add(val){
            if(isNaN(val) && val != undefined)
                return vector(x + val.x, y + val.y);
        },
        sub(val){
            if(isNaN(val) && val != undefined)
                return vector(x - val.x, y - val.y);
        },
        mult(val){
            if(val.x != null)
                return vector(x * val.x, y * val.y);
            if(!isNaN(val))
                return vector(x * val, y * val);
        },
        divide(val){
            if(!isNaN(val))
                return vector(x / val, y / val);
        }
    };
}