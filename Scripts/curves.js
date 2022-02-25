  class Curve {
      constructor(p0, p1, fixed) {
          this.p0f = p0;
          this.p1f = p1;
          this.fixed = fixed;
          this.straight = false;
      }
      draw() {
          if (!this.fixed)
              this.straight = shiftPressed;

          const p0 = this.p0f();
          const p1 = this.p1f();
          this.straight ? line(p0.x, p0.y, p1.x, p1.y) : cubicBezier(p0, p1, vector(p0.x, p1.y), vector(p1.x, p0.y));
      }
  }

  const quadraticBezier = (p0, p1, c0) => {
      noFill();
      beginShape();
      for (let t = 0; t < 1; t += 1 / connectorQuality) {
          const v0 = vector.lerp(p0, c0, t);
          const v1 = vector.lerp(c0, p1, t);
          const v = vector.lerp(v0, v1, t);
          vertex(v.x, v.y);
      }
      endShape();
  }
  const cubicBezier = (p0, p1, c0, c1) => {
      noFill();
      stroke(255);
      strokeWeight(4);
      beginShape();
      for (let t = 0; t < 1; t += 1 / connectorQuality) {
          const v0 = vector.lerp(p0, c0, t);
          const v1 = vector.lerp(c0, p1, t);
          const v2 = vector.lerp(v0, v1, t);
          const v3 = vector.lerp(p0, c1, t);
          const v4 = vector.lerp(c1, p1, t);
          const v5 = vector.lerp(v3, v4, t);
          const v = vector.lerp(v2, v5, t);
          vertex(v.x, v.y);
      }
      endShape();
  }