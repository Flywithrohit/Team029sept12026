const TABLE_LAYOUT_EVENT = 'crm-table-layout:update';

function dispatchTableLayoutUpdate() {
    window.dispatchEvent(new CustomEvent(TABLE_LAYOUT_EVENT));
}

export default {
    name: 'AdaptiveTable',
    props: {
        title: {
            type: String,
            default: 'Table'
        },
        subtitle: {
            type: String,
            default: ''
        },
        rowCount: {
            type: Number,
            default: 0
        },
        minRows: {
            type: Number,
            default: 4
        },
        minCompactHeight: {
            type: Number,
            default: 240
        }
    },
    template: `
        <section class="crm-table-panel"
                 data-adaptive-table-panel="true"
                 :data-expanded="expanded ? 'true' : 'false'">
            <div ref="header" class="crm-table-panel-header">
                <div class="crm-table-panel-heading">
                    <h5 class="crm-table-panel-title">{{ title }}</h5>
                    <p v-if="subtitle" class="crm-table-panel-subtitle">{{ subtitle }}</p>
                </div>
                <div class="crm-table-panel-actions">
                    <button v-if="showToggle"
                            type="button"
                            class="btn btn-sm crm-table-panel-button"
                            :class="{ 'is-expanded': expanded }"
                            @click="toggleExpanded">
                        <i class="bi" :class="expanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'"></i>
                        {{ expanded ? 'Collapse' : 'Expand' }}
                    </button>
                </div>
            </div>

            <div ref="wrap"
                 class="table-responsive crm-table-wrap crm-adaptive-table-wrap"
                 :class="{ 'is-expanded': expanded }"
                 :style="tableWrapStyle">
                <slot></slot>
            </div>

            <div v-if="showFooterSection" ref="footer" class="crm-table-panel-footer">
                <div v-if="hasFooterSlot" class="crm-table-panel-footer-slot">
                    <slot name="footer"></slot>
                </div>
            </div>
        </section>
    `,
    data() {
        return {
            expanded: false,
            compactHeight: this.minCompactHeight,
            expandedHeight: null,
            visibleRows: 0,
            resizeObserver: null
        };
    },
    computed: {
        showToggle() {
            return this.rowCount > this.visibleRows && this.visibleRows > 0;
        },
        hasFooterSlot() {
            return Boolean(this.$slots.footer);
        },
        showFooterSection() {
            return this.hasFooterSlot;
        },
        tableWrapStyle() {
            const maxHeight = this.expanded
                ? (this.expandedHeight ? `${this.expandedHeight}px` : 'none')
                : `${this.compactHeight}px`;

            return {
                maxHeight
            };
        }
    },
    watch: {
        rowCount() {
            this.$nextTick(() => {
                this.syncLayout();
            });
        }
    },
    mounted() {
        window.addEventListener('resize', this.syncLayout, { passive: true });
        window.addEventListener(TABLE_LAYOUT_EVENT, this.syncLayout);

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => {
                this.syncLayout();
            });
            this.resizeObserver.observe(this.$el);
        }

        this.$nextTick(() => {
            this.syncLayout();
            dispatchTableLayoutUpdate();
        });
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.syncLayout);
        window.removeEventListener(TABLE_LAYOUT_EVENT, this.syncLayout);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        dispatchTableLayoutUpdate();
    },
    methods: {
        getVisibleSiblingCount() {
            const page = this.$el?.closest('.crm-page') || document;
            return [...page.querySelectorAll('[data-adaptive-table-panel="true"]')].filter((node) => {
                return node.offsetParent !== null;
            }).length || 1;
        },
        measureTable() {
            const wrap = this.$refs.wrap;
            const thead = wrap?.querySelector('thead');
            const firstBodyRow = wrap?.querySelector('tbody tr');
            const headerHeight = Math.max(Math.round(thead?.getBoundingClientRect().height || 48), 44);
            const rowHeight = Math.max(Math.round(firstBodyRow?.getBoundingClientRect().height || 52), 46);
            const panelHeaderHeight = Math.round(this.$refs.header?.getBoundingClientRect().height || 0);
            const panelFooterHeight = Math.round(this.$refs.footer?.getBoundingClientRect().height || 0);

            return { headerHeight, rowHeight, panelHeaderHeight, panelFooterHeight };
        },
        syncLayout() {
            if (!this.$el || this.$el.offsetParent === null) {
                return;
            }

            const { headerHeight, rowHeight, panelHeaderHeight, panelFooterHeight } = this.measureTable();
            const siblingCount = this.getVisibleSiblingCount();
            const panelRect = this.$el.getBoundingClientRect();
            const page = this.$el.closest('.crm-page');
            const pageRect = page?.getBoundingClientRect?.() || { top: 0 };
            const viewportHeight = window.innerHeight;
            const isMobile = window.innerWidth < 768;
            const compactMinHeight = isMobile ? 220 : this.minCompactHeight;
            const minRows = isMobile ? Math.max(3, this.minRows - 1) : this.minRows;
            const remainingViewport = Math.max(compactMinHeight, Math.floor(viewportHeight - panelRect.top - (isMobile ? 18 : 28)));

            let targetHeight;
            if (siblingCount <= 1) {
                targetHeight = remainingViewport;
            } else {
                const sharedViewport = Math.max(
                    compactMinHeight,
                    Math.floor((viewportHeight - Math.max(pageRect.top, 0) - (isMobile ? 40 : 56) - ((siblingCount - 1) * (isMobile ? 14 : 18))) / siblingCount)
                );
                targetHeight = Math.min(remainingViewport, sharedViewport);
            }

            if (isMobile) {
                targetHeight = Math.min(targetHeight, Math.floor(viewportHeight * 0.56));
            }

            const chromeHeight = panelHeaderHeight + panelFooterHeight + (isMobile ? 10 : 14);
            const wrapBudget = Math.max(compactMinHeight - chromeHeight, targetHeight - chromeHeight);
            const usableBodyHeight = Math.max(rowHeight * minRows, wrapBudget - headerHeight);
            const visibleRows = Math.max(minRows, Math.floor(usableBodyHeight / rowHeight));
            const snappedCompactHeight = headerHeight + (visibleRows * rowHeight) + 2;

            this.visibleRows = visibleRows;
            this.compactHeight = snappedCompactHeight;
            this.expandedHeight = isMobile
                ? Math.min(headerHeight + (Math.max(this.rowCount, visibleRows) * rowHeight) + 2, Math.floor(viewportHeight * 0.72))
                : Math.min(headerHeight + (Math.max(this.rowCount, visibleRows) * rowHeight) + 2, Math.floor(viewportHeight * 0.8));
        },
        toggleExpanded() {
            this.expanded = !this.expanded;
            this.$nextTick(() => {
                this.syncLayout();
                dispatchTableLayoutUpdate();
            });
        }
    }
};
