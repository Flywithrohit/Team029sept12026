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
        }
    },
    emits: ['update:modelValue'],
    template: `
    <div class="crm-select" :style="containerStyle">
        <button type="button" class="crm-select-trigger" :class="{ 'is-open': open }" @click.stop="toggle">
            <span class="crm-select-label">{{ selectedLabel }}</span>
            <i class="bi" :class="open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
        </button>
        <div v-if="open" class="crm-select-menu">
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
    </div>
    `,
    data() {
        return {
            open: false
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
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleDocumentClick);
    },
    methods: {
        toggle() {
            this.open = !this.open;
        },
        selectOption(value) {
            this.$emit('update:modelValue', value);
            this.open = false;
        },
        isSelected(value) {
            return String(this.modelValue ?? '') === String(value ?? '');
        },
        handleDocumentClick(event) {
            if (this.$el && !this.$el.contains(event.target)) {
                this.open = false;
            }
        }
    }
};
