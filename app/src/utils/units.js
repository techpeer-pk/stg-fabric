// Product unit values are stored lowercase (see UNIT_OPTIONS in pages/products/Products.jsx).
// This turns the stored value into a display label, e.g. 'bundle' -> 'Bundle'.
export const formatUnit = (unit) => {
    if (!unit) return ''
    if (unit === 'pcs') return 'Pcs'
    if (unit === 'kg') return 'Kg'
    if (unit === 'ltr') return 'Ltr'
    return unit.charAt(0).toUpperCase() + unit.slice(1)
}
