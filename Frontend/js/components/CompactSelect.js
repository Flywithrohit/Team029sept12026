export default {
    name: 'CompactSelect',
    props: {
        modelValue: {
            type: [String, Number, null],
            default: ''
        },
        options: {
            type: Array,
            default: () => []
        },
        placeholder: {
            type: String,
            default: 'Select'
        },
        width: {
            type: String,
            default: ''
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    template: `
    <div class="crm-select" :style="containerStyle" ref="container">
        <button type="button" ref="trigger" class="crm-select-trigger" :class="{ 'is-open': open }" :disabled="disabled" @click.stop="toggle">
            <span class="crm-select-label">{{ selectedLabel }}</span>
            <i class="bi" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
        </button>
        
        <teleport to="body">
            <div v-if="open" ref="menu" class="crm-select-menu" :style="menuStyle" @click.stop>
                <button
                    v-for="option in normalizedOptions"
                    :key="String(option.value)"
                    type="button"
                    class="crm-select-option"
                    :class="{ 'is-selected': isSelected(option.value) }"
                    @click="selectOption(option.value)"
                >
                    <span class="crm-select-label">{{ option.label }}</span>
                    <i v-if="isSelected(option.value)" class="bi bi-check2"></i>
                </button>
            </div>
        </teleport>
    </div>
    `,
    data() {
        return {
            open: false,
            menuStyle: {}
        };
    },
    computed: {
        normalizedOptions() {
            return this.options.map(option => {
                if (option && typeof option === 'object') {
                    return {
                        label: option.label ?? String(option.value ?? ''),
                        value: option.value
                    };
                }
                return {
                    label: String(option),
                    value: option
                };
            });
        },
        selectedLabel() {
            const selected = this.normalizedOptions.find(option => this.isSelected(option.value));
            return selected ? selected.label : this.placeholder;
        },
        containerStyle() {
            return this.width ? { width: this.width } : {};
        }
    },
    mounted() {
        document.addEventListener('click', this.handleDocumentClick);
        window.addEventListener('resize', this.updateMenuPosition);
        window.addEventListener('scroll', this.updateMenuPosition, true);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleDocumentClick);
        window.removeEventListener('resize', this.updateMenuPosition);
        window.removeEventListener('scroll', this.updateMenuPosition, true);
    },
    methods: {
        toggle() {
            if (this.disabled) return;
            this.open = !this.open;
            if (this.open) {
                this.$nextTick(this.updateMenuPosition);
            }
        },
        updateMenuPosition() {
            if (!this.open || !this.$refs.trigger) return;
            
            const rect = this.$refs.trigger.getBoundingClientRect();
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            
            // Basic alignment: same width as trigger, positioned directly below
            this.menuStyle = {
                position: 'absolute',
                top: `${rect.bottom + scrollY + 4}px`,
                left: `${rect.left + scrollX}px`,
                width: `${rect.width}px`,
                zIndex: 9999, // Ensure it's above modals
                maxHeight: '300px',
                overflowY: 'auto'
            };

            // Check if there is enough space below
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 200) {
                // If not enough space, flip to top
                this.menuStyle.top = 'auto'; // Reset top
                this.menuStyle.bottom = `${window.innerHeight - rect.top - scrollY + 4}px`;
            }
        },
        selectOption(value) {
            if (this.disabled) return;
            this.$emit('update:modelValue', value);
            this.open = false;
        },
        isSelected(value) {
            return String(this.modelValue ?? '') === String(value ?? '');
        },
        handleDocumentClick(event) {
            if (this.open && this.$refs.trigger && !this.$refs.trigger.contains(event.target)) {
                this.open = false;
            }
        }
    }
};
