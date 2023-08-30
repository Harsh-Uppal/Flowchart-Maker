const load = () => {
    document.querySelectorAll('shortcut-input').forEach(s => {
        new ShortcutInput(s);
    });

    let openOptions;
    document.querySelectorAll('#settings-selectors>*').forEach(selector => {
        const options = document.querySelector('.setting-options[data-div="' + selector.getAttribute('data-div') + '"]')

        if (!openOptions)
            openOptions = options;
        else
            options.style.display = 'none';

        selector.addEventListener('click', () => {
            if (openOptions == options)
                return;

            options.style.display = '';
            openOptions.style.display = 'none';
            openOptions = options;
        })
    })

    document.getElementById('primary-font-setting').addEventListener('change', e => {
        document.querySelector('html').style.setProperty('--font-primary', e.target.value);
    })
};

//Check %node%.value.keys for shortcut keys
class ShortcutInput {
    constructor(node) {
        const loadOptions = (options, element) => {
            options.forEach(opt => {
                let option = document.createElement('option');
                option.value = opt[1];
                option.textContent = opt[0];
                element.appendChild(option);
            });
        }

        const change = (e, index) => {
            val[index] = e.target.selectedIndex;
            let keys = [];
            node.value.keys.forEach(key => {
                keys.push(key[1]);
            })
            ShortcutManager.setShortcutKeys(name, keys)
            node.dispatchEvent(new Event('change'));
        }

        var val;
        this.node = node;

        const name = node.getAttribute('data-shortcut');
        if (!name) return;
        const keys = ShortcutManager.getShortcutKeys(name);
        if (!keys) return;

        node.textContent = '';
        const key0 = document.createElement('select');
        const keyCodes0 = [['Shift', 16], ['Ctrl', 17], ['Alt', 18]];
        loadOptions(keyCodes0, key0);
        key0.addEventListener('change', e => change(e, 0));
        key0.value = keys[0];

        const key1 = document.createElement('select');
        const keyCodes1 = [];

        key1.addEventListener('change', e => change(e, 1));

        for (let i = 65; i < 91; i++)
            keyCodes1.push([String.fromCharCode(i).toUpperCase(), i]);

        loadOptions(keyCodes1, key1);
        key1.value = keys[1];

        node.append(key0, key1);

        val = [key0.selectedIndex, key1.selectedIndex]
        node.value = {
            get keys() {
                let keys = [keyCodes0[val[0]], keyCodes1[val[1]]];
                return keys;
            },
            set keys(keys) {
                if (!Array.isArray(keys) || keys.length != 2) {
                    console.error('Invalid value');
                    return;
                }

                val = keys;
                key0.selectedIndex = keys[0];
                key1.selectedIndex = keys[1];
            }
        }

        this.key0 = key0;
        this.key1 = key1;
    }
}

window.addEventListener('load', load);

function openSettings() {
    settingsModal.open = true;
}

function closeSettings() {
    settingsModal.open = false;
}