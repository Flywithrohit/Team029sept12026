export default {
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'date'
        },
        min: {
            type: String,
            default: ''
        },
        placeholder: {
            type: String,
            default: ''
        },
        required: {
            type: Boolean,
            default: false
        },
        disabled: {
            type: Boolean,
            default: false
        },
        id: {
            type: String,
            default: ''
        }
    },
    emits: ['update:modelValue', 'change'],
    template: `
        <div class="crm-calendar-field" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
            <button
                ref="trigger"
                type="button"
                class="form-control crm-calendar-trigger"
                :id="id || undefined"
                :disabled="disabled"
                @click="toggleCalendar"
            >
                <span :class="{ 'crm-calendar-placeholder': !modelValue }">{{ displayValue }}</span>
                <span class="crm-calendar-icon" aria-hidden="true">
                    <i class="bi" :class="isDateTime ? 'bi-calendar-event' : 'bi-calendar2-week'"></i>
                </span>
            </button>

            <teleport to="body">
                <div
                    v-if="isOpen"
                    ref="panel"
                    class="crm-calendar-popover"
                    :class="{ 'is-datetime': isDateTime, 'is-top': panelPlacement === 'top' }"
                    :style="panelStyle"
                    @click.stop
                >
                    <div class="crm-calendar-popover-head">
                        <button type="button" class="crm-calendar-nav" @click="changeMonth(-1)">
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <div class="crm-calendar-title">{{ monthLabel }}</div>
                        <button type="button" class="crm-calendar-nav" @click="changeMonth(1)">
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>

                    <div class="crm-calendar-weekdays">
                        <span v-for="day in weekdays" :key="day">{{ day }}</span>
                    </div>

                    <div class="crm-calendar-grid">
                        <button
                            v-for="day in calendarDays"
                            :key="day.key"
                            type="button"
                            class="crm-calendar-day"
                            :class="{
                                'is-muted': !day.currentMonth,
                                'is-selected': day.isSelected,
                                'is-today': day.isToday,
                                'is-disabled': day.disabled
                            }"
                            :disabled="day.disabled"
                            @click="selectDay(day)"
                        >
                            {{ day.label }}
                        </button>
                    </div>

                    <div v-if="isDateTime" class="crm-calendar-time">
                        <div class="crm-calendar-time-group">
                            <label class="crm-calendar-time-label">Hour</label>
                            <div class="crm-calendar-time-stepper">
                                <button type="button" class="crm-calendar-time-btn" @click="adjustTimeUnit('hour', 1)">
                                    <i class="bi bi-chevron-up"></i>
                                </button>
                                <div class="crm-calendar-time-value">{{ pad(draftHour) }}</div>
                                <button type="button" class="crm-calendar-time-btn" @click="adjustTimeUnit('hour', -1)">
                                    <i class="bi bi-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                        <div class="crm-calendar-time-group">
                            <label class="crm-calendar-time-label">Minute</label>
                            <div class="crm-calendar-time-stepper">
                                <button type="button" class="crm-calendar-time-btn" @click="adjustTimeUnit('minute', 5)">
                                    <i class="bi bi-chevron-up"></i>
                                </button>
                                <div class="crm-calendar-time-value">{{ pad(draftMinute) }}</div>
                                <button type="button" class="crm-calendar-time-btn" @click="adjustTimeUnit('minute', -5)">
                                    <i class="bi bi-chevron-down"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="crm-calendar-actions">
                        <button type="button" class="btn btn-light btn-sm" @click="clearValue">Clear</button>
                        <button type="button" class="btn btn-primary btn-sm" @click="applySelection">Apply</button>
                    </div>
                </div>
            </teleport>
        </div>
    `,
    data() {
        return {
            isOpen: false,
            viewDate: this.parseModelValue(this.modelValue) || this.getMinDate() || new Date(),
            draftDate: this.parseModelValue(this.modelValue),
            draftHour: this.parseModelValue(this.modelValue)?.getHours?.() ?? 9,
            draftMinute: this.parseModelValue(this.modelValue)?.getMinutes?.() ?? 0,
            panelStyle: {},
            panelPlacement: 'bottom'
        };
    },
    computed: {
        isDateTime() {
            return this.type === 'datetime-local';
        },
        weekdays() {
            return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        },
        hours() {
            return Array.from({ length: 24 }, (_, index) => index);
        },
        minutes() {
            return Array.from({ length: 12 }, (_, index) => index * 5);
        },
        displayValue() {
            if (!this.modelValue) {
                return this.placeholder || (this.isDateTime ? 'Select date and time' : 'Select date');
            }
            const date = this.parseModelValue(this.modelValue);
            if (!date) return this.modelValue;
            return this.isDateTime
                ? date.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : date.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
        },
        monthLabel() {
            return this.viewDate.toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric'
            });
        },
        calendarDays() {
            const start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1);
            const startWeekday = start.getDay();
            const gridStart = new Date(start);
            gridStart.setDate(start.getDate() - startWeekday);

            return Array.from({ length: 42 }, (_, index) => {
                const date = new Date(gridStart);
                date.setDate(gridStart.getDate() + index);
                const normalized = this.toDateValue(date);
                const selected = this.draftDate ? this.toDateValue(this.draftDate) === normalized : false;
                const today = this.toDateValue(new Date()) === normalized;
                const disabled = this.isBeforeMin(date);

                return {
                    key: normalized,
                    label: date.getDate(),
                    value: new Date(date),
                    currentMonth: date.getMonth() === this.viewDate.getMonth(),
                    isSelected: selected,
                    isToday: today,
                    disabled
                };
            });
        }
    },
    watch: {
        modelValue(newValue) {
            const parsed = this.parseModelValue(newValue);
            this.draftDate = parsed;
            if (parsed) {
                this.viewDate = new Date(parsed);
                this.draftHour = parsed.getHours();
                this.draftMinute = parsed.getMinutes();
            }
        },
        min() {
            if (this.draftDate && this.isBeforeMin(this.draftDate)) {
                this.clearValue();
            }
        }
    },
    mounted() {
        document.addEventListener('click', this.handleDocumentClick);
        window.addEventListener('resize', this.updatePanelPosition);
        window.addEventListener('scroll', this.updatePanelPosition, true);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleDocumentClick);
        window.removeEventListener('resize', this.updatePanelPosition);
        window.removeEventListener('scroll', this.updatePanelPosition, true);
    },
    methods: {
        pad(value) {
            return String(value).padStart(2, '0');
        },
        getMinDate() {
            return this.parseModelValue(this.min);
        },
        parseModelValue(value) {
            if (!value) return null;
            if (this.isDateTime) {
                const [datePart, timePart = '00:00'] = value.split('T').length > 1 ? value.split('T') : value.split(' ');
                if (!datePart) return null;
                const [year, month, day] = datePart.split('-').map(Number);
                const [hour, minute] = timePart.split(':').map(Number);
                return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
            }
            const [year, month, day] = value.split('-').map(Number);
            if (!year || !month || !day) return null;
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        },
        toDateValue(date) {
            return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
        },
        toDateTimeValue(date) {
            return `${this.toDateValue(date)}T${this.pad(date.getHours())}:${this.pad(date.getMinutes())}`;
        },
        isBeforeMin(date) {
            const minDate = this.getMinDate();
            if (!minDate) return false;
            if (this.isDateTime) return date < minDate;
            return this.toDateValue(date) < this.toDateValue(minDate);
        },
        toggleCalendar() {
            if (this.disabled) return;
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                if (this.draftDate) {
                    this.viewDate = new Date(this.draftDate);
                }
                this.$nextTick(this.updatePanelPosition);
            }
        },
        handleDocumentClick(event) {
            const trigger = this.$refs.trigger;
            const panel = this.$refs.panel;
            if (!this.isOpen) return;
            if (trigger?.contains(event.target) || panel?.contains(event.target)) return;
            this.isOpen = false;
        },
        updatePanelPosition() {
            if (!this.isOpen || !this.$refs.trigger) return;
            const rect = this.$refs.trigger.getBoundingClientRect();
            const panel = this.$refs.panel;
            const width = Math.max(rect.width, this.isDateTime ? 332 : 290);
            const panelHeight = panel?.offsetHeight || (this.isDateTime ? 432 : 372);
            const viewportPadding = 12;
            const gap = 10;
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            let left = rect.left + scrollX;
            if (left + width > scrollX + window.innerWidth - viewportPadding) {
                left = scrollX + window.innerWidth - width - viewportPadding;
            }
            left = Math.max(scrollX + viewportPadding, left);

            const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
            const spaceAbove = rect.top - viewportPadding;
            const shouldOpenAbove = spaceBelow < panelHeight && spaceAbove > spaceBelow;
            this.panelPlacement = shouldOpenAbove ? 'top' : 'bottom';

            let top = shouldOpenAbove
                ? rect.top + scrollY - panelHeight - gap
                : rect.bottom + scrollY + gap;

            const minTop = scrollY + viewportPadding;
            const maxTop = scrollY + window.innerHeight - panelHeight - viewportPadding;
            top = Math.min(Math.max(minTop, top), Math.max(minTop, maxTop));

            this.panelStyle = {
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                maxHeight: `${Math.max(280, window.innerHeight - (viewportPadding * 2))}px`,
                zIndex: 2000
            };
        },
        changeMonth(direction) {
            this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + direction, 1);
        },
        selectDay(day) {
            if (day.disabled) return;
            const next = this.draftDate ? new Date(this.draftDate) : new Date(day.value);
            next.setFullYear(day.value.getFullYear(), day.value.getMonth(), day.value.getDate());
            if (!this.isDateTime) {
                next.setHours(0, 0, 0, 0);
            } else {
                next.setHours(this.draftHour, this.draftMinute, 0, 0);
            }
            this.draftDate = next;
        },
        syncDateTime() {
            if (!this.draftDate) {
                this.draftDate = this.getMinDate() || new Date();
            }
            this.draftDate = new Date(this.draftDate);
            this.draftDate.setHours(this.draftHour, this.draftMinute, 0, 0);
        },
        adjustTimeUnit(unit, amount) {
            if (!this.draftDate) {
                this.draftDate = this.getMinDate() || new Date();
            }

            if (unit === 'hour') {
                this.draftHour = (this.draftHour + amount + 24) % 24;
            } else {
                const values = this.minutes;
                const currentIndex = values.indexOf(this.draftMinute);
                const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;
                const nextIndex = (normalizedIndex + (amount > 0 ? 1 : -1) + values.length) % values.length;
                this.draftMinute = values[nextIndex];
            }

            this.syncDateTime();
        },
        clearValue() {
            this.draftDate = null;
            this.$emit('update:modelValue', '');
            this.$emit('change', '', []);
            this.isOpen = false;
        },
        applySelection() {
            if (!this.draftDate) {
                if (this.required) return;
                this.clearValue();
                return;
            }
            if (this.isBeforeMin(this.draftDate)) return;
            const value = this.isDateTime ? this.toDateTimeValue(this.draftDate) : this.toDateValue(this.draftDate);
            this.$emit('update:modelValue', value);
            this.$emit('change', value, [new Date(this.draftDate)]);
            this.isOpen = false;
        }
    }
};
