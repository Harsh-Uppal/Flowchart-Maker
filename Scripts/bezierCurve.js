class CubicBezierCurve {
    constructor(p1, p2) {
        this.p = [p1, vector(p2.x, p1.y), vector(p1.x, p2.y), p2];
    }
    changeP1(newP1){
        this.p[0] = newP1;
        this.p[1].y = newP1.y;
        this.p[2].x = newP1.x;
    }
    changeP2(newP2){
        this.p[1].x = newP2.x;
        this.p[2].y = newP2.y;
        this.p[3] = newP2;
    }
    display() {
        let lastP = this.p[0];
        for (let i = 0; i < bezierQuality; i ++) {
            const t = i / bezierQuality;
            const a = this.p[0].mult(1 - t).add(this.p[1].mult(t));
            const b = this.p[1].mult(1 - t).add(this.p[2].mult(t));
            const c = this.p[2].mult(1 - t).add(this.p[3].mult(t));
            const d = a.mult(1 - t).add(b.mult(t));
            const e = b.mult(1 - t).add(c.mult(t));
            const cP = d.mult(1 - t).add(e.mult(t));

            line(lastP.x, lastP.y, cP.x, cP.y);
            lastP = cP;
        }
    }
}