window.addEventListener('load', () => {
    document.querySelectorAll('input[image]').forEach(imageInput => {
        imageInput.addEventListener('click', () => {
            let fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image.*';
            fileInput.addEventListener('change', () => {
                imageInput.value = URL.createObjectURL(fileInput.files[0]);
                imageInput.dispatchEvent(new Event('change'));
            });
            fileInput.click();
        })
    })
    document.querySelectorAll('multiple-input').forEach(input => {
        new MultipleInput(input);
    });
});

document.body.addEventListener('click', e => {
    if (!tagPresentInParentTree(e.target, 'multiple-input') && MultipleInput.open)
        MultipleInput.open.close();
})

class MultipleInput {
    constructor(node) {
        this.node = node;
        this.selector = node.children[1];
        this.types = this.selector.children[0].children[0].children;
        this.inputs = this.selector.children[0].children[1].children;
        this.selectedType = 0;
        this.closed = true;
        this.size = vec()

        if (this.types.length != this.inputs.length) {
            console.error('Number of types and inputs must be equal in a MultipleInput');
            return;
        }

        this.types.forEach((type, index) => {
            type.addEventListener('click', () => this.selectType(index));
        });

        this.inputs.forEach(input => {
            input.style.display = 'none';
            input.addEventListener('change', () => {
                this.node.value = input.value;
                this.node.type = input.type;
                node.dispatchEvent(new Event('change'));
            });
        });

        node.value = this.inputs[0].value;
        node.addEventListener('click', this.onclick);
        this.selector.style.display = 'none';
        this.inputs[this.selectedType].style.display = '';
        this.types[this.selectedType].style.backgroundColor = '#BBFFFF';
    }
    onclick = e => {
        if (this.node.disabled)
            return;
        if (e.target != this.selector && (e.target == this.node || e.target.parentNode == this.node)) {
            this.selector.style.display = this.selector.style.display == '' ? 'none' : '';
            if (MultipleInput.open)
                MultipleInput.open.close();
            MultipleInput.open = this.selector.style.display == '' ? this : null;
        }
    }
    selectType = typeIndex => {
        this.types[this.selectedType].style.backgroundColor = '';
        this.types[typeIndex].style.backgroundColor = '#BBFFFF';

        this.inputs[this.selectedType].style.display = 'none';
        this.inputs[typeIndex].style.display = '';

        this.selectedType = typeIndex;
    }
    open() {
        if (this.selector.style.display == '')
            return;

        if (MultipleInput.open)
            MultipleInput.open.close();

        this.selector.style.display = '';
        MultipleInput.open = this;
    }
    close() {
        if (this.selector.style.display == 'none')
            return;

        this.selector.style.display = 'none';
        MultipleInput.open = null;
    }
}

function tagPresentInParentTree(e, tag) {
    return e.tagName == tag.toUpperCase() || (e.parentNode && tagPresentInParentTree(e.parentNode, tag));
}