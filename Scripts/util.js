const vec = vector = (x, y) => {
    return { 
        x: x,
        y: y,
        add(val){
            if(!isNaN(val))
                return vector(x + val, y + val);
            if(val != undefined)
                return vector(x + val.x, y + val.y);
        },
        sub(val){
            if(!isNaN(val))
                return vector(x - val, y - val);
            if(val != undefined)
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
        },
        round(){
            return vector(Math.round(x), Math.round(y));
        }
    };
}

vector.lerp = (v0, v1, t) => vector(v0.x + (v1.x - v0.x) * t, v0.y + (v1.y - v0.y) * t);