const curve = (p1, p2) => ({
    p1f: p1,
    p2f: p2
});

function drawCurve({
    p1f,
    p2f
}) {

    const p1 = p1f(),
        p2 = p2f();

    if (shiftPressed) {
        line(p1.x, p1.y, p2.x, p2.y);
        return;
    }

    const w = p2.x - p1.x,
        h = p2.y - p1.y;

    push();
    translate(p1.x, p1.y);
    noFill();
    beginShape();
    for (let i = 0; i < 1; i += 1 / connectorQuality) {
        const Y = i * h;
        const sinY = h - (sin(Y / PI / (h / 10) + HALF_PI) * h / 2 + h / 2);
        vertex(i * w, sinY + sinY - Y);
    }
    endShape();
    pop();
}