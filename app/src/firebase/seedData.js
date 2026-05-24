/**
 * Seed Data Generator — Fabric POS (STG Fabric Factory)
 * Use this to populate test data into Firestore for demo/development
 * Called from: Backup.jsx → "Seed Test Data" button
 */
import { db } from './config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export const generateSeedData = {

    /**
     * Business info
     */
    business: (overrides = {}) => ({
        businessName: 'STG Fabric Factory',
        owner_uid: 'test-owner-uid',
        createdAt: new Date(),
        settings: {
            currency: 'PKR',
            timezone: 'Asia/Karachi',
            language: 'ur'
        },
        ...overrides
    }),

    /**
     * Branch info
     */
    branch: (overrides = {}) => ({
        branchName: 'Karachi - Main Factory',
        location: 'SITE Area, Karachi, Pakistan',
        manager_uid: 'test-manager-uid',
        createdAt: new Date(),
        settings: {
            currency: 'PKR',
            tax_rate: 0.05,
            receipt_template: 'detailed',
            receipt_header: 'STG Fabric Factory',
            receipt_footer: 'SITE Area, Karachi — +92 321 0000000'
        },
        ...overrides
    }),

    /**
     * 10 Fabric products
     */
    products: () => [
        {
            name: 'Cotton Lawn - White',
            sku: 'FAB-CTN-LAWN-001',
            price: 350,
            costPrice: 200,
            category_id: 'cat-lawn',
            description: 'Premium quality cotton lawn fabric — 58 inch width. Suitable for suits and dupattas.',
            unit: 'meter',
            width: '58 inch',
            gsm: 90,
            color: 'White',
            image: ''
        },
        {
            name: 'Printed Lawn - Floral',
            sku: 'FAB-PRT-LAWN-002',
            price: 480,
            costPrice: 280,
            category_id: 'cat-lawn',
            description: 'Digital printed floral lawn — season collection. 58 inch width.',
            unit: 'meter',
            width: '58 inch',
            gsm: 90,
            color: 'Multi-Color',
            image: ''
        },
        {
            name: 'Pure Cotton - Grey',
            sku: 'FAB-CTN-GREY-003',
            price: 280,
            costPrice: 160,
            category_id: 'cat-cotton',
            description: 'Medium weight pure cotton fabric. Used for casual shirts and trousers.',
            unit: 'meter',
            width: '44 inch',
            gsm: 120,
            color: 'Grey',
            image: ''
        },
        {
            name: 'Raw Silk - Ivory',
            sku: 'FAB-SLK-RAW-004',
            price: 1800,
            costPrice: 1100,
            category_id: 'cat-silk',
            description: 'Natural raw silk fabric from Thailand. Perfect for formal wear and bridal use.',
            unit: 'meter',
            width: '44 inch',
            gsm: 75,
            color: 'Ivory',
            image: ''
        },
        {
            name: 'Chiffon - Black',
            sku: 'FAB-CHF-BLK-005',
            price: 650,
            costPrice: 380,
            category_id: 'cat-silk',
            description: 'Lightweight poly chiffon fabric. Ideal for dupattas and formal blouses.',
            unit: 'meter',
            width: '58 inch',
            gsm: 55,
            color: 'Black',
            image: ''
        },
        {
            name: 'Stretch Denim - Indigo',
            sku: 'FAB-DNM-IND-006',
            price: 750,
            costPrice: 480,
            category_id: 'cat-denim',
            description: '2% elastane stretch denim. 10oz weight. Excellent for trousers and jeans.',
            unit: 'meter',
            width: '60 inch',
            gsm: 340,
            color: 'Indigo Blue',
            image: ''
        },
        {
            name: 'Polyester Satin - Maroon',
            sku: 'FAB-SAT-MAR-007',
            price: 420,
            costPrice: 240,
            category_id: 'cat-synthetic',
            description: 'Smooth poly satin fabric with lustrous finish. Bridal and party wear.',
            unit: 'meter',
            width: '58 inch',
            gsm: 100,
            color: 'Maroon',
            image: ''
        },
        {
            name: 'Pure Linen - Beige',
            sku: 'FAB-LNN-BEG-008',
            price: 900,
            costPrice: 580,
            category_id: 'cat-linen',
            description: 'Belgian linen — breathable and durable. Best for summer kurtas and suits.',
            unit: 'meter',
            width: '58 inch',
            gsm: 185,
            color: 'Beige',
            image: ''
        },
        {
            name: 'Velvet - Royal Blue',
            sku: 'FAB-VLV-BLU-009',
            price: 1200,
            costPrice: 750,
            category_id: 'cat-synthetic',
            description: 'Soft Korean velvet — deep pile. Popular for winter formals and shawls.',
            unit: 'meter',
            width: '44 inch',
            gsm: 380,
            color: 'Royal Blue',
            image: ''
        },
        {
            name: 'Embroidered Organza - Pink',
            sku: 'FAB-ORG-PNK-010',
            price: 2200,
            costPrice: 1400,
            category_id: 'cat-silk',
            description: 'Hand embroidered organza with floral zari work. Premium bridal fabric.',
            unit: 'meter',
            width: '44 inch',
            gsm: 65,
            color: 'Pink',
            image: ''
        }
    ],

    /**
     * Fabric categories
     */
    categories: () => [
        { name: 'Lawn',      description: 'Cotton & Printed Lawn Fabrics' },
        { name: 'Cotton',    description: 'Plain and Woven Cotton Fabrics' },
        { name: 'Silk',      description: 'Silk, Chiffon and Organza Fabrics' },
        { name: 'Denim',     description: 'Denim and Canvas Fabrics' },
        { name: 'Synthetic', description: 'Polyester, Satin and Velvet Fabrics' },
        { name: 'Linen',     description: 'Linen and Blended Fabrics' }
    ],

    /**
     * Fabric customers — Pakistani + Thai
     */
    customers: () => [
        {
            name: 'Ahmed Textiles',
            phone: '+923001112233',
            email: 'ahmed.textiles@gmail.com',
            address: 'Jodia Bazar, Karachi',
            loyaltyPoints: 2800,
            totalSpent: 185000,
            totalVisits: 34
        },
        {
            name: 'Rehman Boutique',
            phone: '+923012223344',
            email: 'rehman.boutique@gmail.com',
            address: 'Tariq Road, Karachi',
            loyaltyPoints: 1500,
            totalSpent: 92000,
            totalVisits: 18
        },
        {
            name: 'Fatima Designs',
            phone: '+923215556677',
            email: 'fatima.designs@gmail.com',
            address: 'Defence, Karachi',
            loyaltyPoints: 3600,
            totalSpent: 240000,
            totalVisits: 47
        },
        {
            name: 'Somchai Trading Co.',
            phone: '+66812345678',
            email: 'somchai.trading@gmail.com',
            address: 'Bangkok, Thailand',
            loyaltyPoints: 5200,
            totalSpent: 620000,
            totalVisits: 12
        },
        {
            name: 'Bangkok Fabric House',
            phone: '+66823456789',
            email: 'bkk.fabrics@gmail.com',
            address: 'Pratunam Market, Bangkok',
            loyaltyPoints: 4100,
            totalSpent: 430000,
            totalVisits: 9
        }
    ],

    /**
     * Fabric suppliers
     */
    suppliers: () => [
        {
            name: 'Faisalabad Textile Mills',
            contact_person: 'Tariq Mehmood',
            phone: '+924112345678',
            email: 'sales@fsdmills.com',
            address: 'Susan Road, Faisalabad, Pakistan',
            payment_terms: '30 days net',
            tax_id: 'TX-FAB-001'
        },
        {
            name: 'Al-Karam Fabrics Wholesale',
            contact_person: 'Kamran Ali',
            phone: '+922132345678',
            email: 'wholesale@alkaram.pk',
            address: 'Korangi Industrial Area, Karachi',
            payment_terms: '15 days net',
            tax_id: 'TX-FAB-002'
        },
        {
            name: 'Thailand Silk Imports',
            contact_person: 'Priya Somrat',
            phone: '+66891234567',
            email: 'priya@thaisilk.com',
            address: 'Jim Thompson District, Bangkok',
            payment_terms: '45 days net',
            tax_id: 'TX-FAB-003'
        }
    ],

    /**
     * Inventory per branch
     */
    inventory: (productIds = [], products = []) => {
        return productIds.map((productId, index) => {
            const product = products.find(p => p.id === productId) || {}
            return {
                productId,
                productName: product.name || `Fabric ${index + 1}`,
                quantity: Math.floor(Math.random() * 200) + 50, // meters
                minThreshold: 20, // alert if below 20 meters
                lastRestocked: new Date(),
                location: `Rack-${String.fromCharCode(65 + (index % 6))}-${index + 1}`,
                updatedAt: new Date()
            }
        })
    },

    /**
     * Sample sales — fabric orders in meters
     */
    sales: (customerId = null) => [
        {
            items: [
                { productId: 'p1', name: 'Cotton Lawn - White', quantity: 50, unitPrice: 350, total: 17500, unit: 'meter' },
                { productId: 'p2', name: 'Printed Lawn - Floral', quantity: 30, unitPrice: 480, total: 14400, unit: 'meter' }
            ],
            subtotal: 31900,
            discount: 900,
            tax: 1550,
            finalAmount: 32550,
            customerId: customerId || 'cust-001',
            customerName: 'Ahmed Textiles',
            cashierId: 'cashier-001',
            paymentMethod: 'cash',
            notes: 'Bulk order — lawn season stock'
        },
        {
            items: [
                { productId: 'p4', name: 'Raw Silk - Ivory', quantity: 20, unitPrice: 1800, total: 36000, unit: 'meter' },
                { productId: 'p10', name: 'Embroidered Organza - Pink', quantity: 10, unitPrice: 2200, total: 22000, unit: 'meter' }
            ],
            subtotal: 58000,
            discount: 3000,
            tax: 2750,
            finalAmount: 57750,
            customerId: customerId || 'cust-004',
            customerName: 'Somchai Trading Co.',
            cashierId: 'cashier-001',
            paymentMethod: 'bank_transfer',
            notes: 'Thailand export order — bridal collection'
        },
        {
            items: [
                { productId: 'p6', name: 'Stretch Denim - Indigo', quantity: 100, unitPrice: 750, total: 75000, unit: 'meter' }
            ],
            subtotal: 75000,
            discount: 5000,
            tax: 3500,
            finalAmount: 73500,
            customerId: customerId || 'cust-002',
            customerName: 'Rehman Boutique',
            cashierId: 'cashier-001',
            paymentMethod: 'card',
            notes: 'Denim — autumn collection order'
        },
        {
            items: [
                { productId: 'p7', name: 'Polyester Satin - Maroon', quantity: 40, unitPrice: 420, total: 16800, unit: 'meter' },
                { productId: 'p9', name: 'Velvet - Royal Blue', quantity: 25, unitPrice: 1200, total: 30000, unit: 'meter' }
            ],
            subtotal: 46800,
            discount: 1800,
            tax: 2250,
            finalAmount: 47250,
            customerId: customerId || 'cust-003',
            customerName: 'Fatima Designs',
            cashierId: 'cashier-001',
            paymentMethod: 'cash',
            notes: 'Winter wedding collection fabric'
        },
        {
            items: [
                { productId: 'p8', name: 'Pure Linen - Beige', quantity: 60, unitPrice: 900, total: 54000, unit: 'meter' }
            ],
            subtotal: 54000,
            discount: 4000,
            tax: 2500,
            finalAmount: 52500,
            customerId: customerId || 'cust-005',
            customerName: 'Bangkok Fabric House',
            cashierId: 'cashier-001',
            paymentMethod: 'bank_transfer',
            notes: 'Thailand export — linen summer range'
        }
    ],

    /**
     * Cash flow entries
     */
    cashFlow: () => [
        {
            type: 'sale',
            description: 'Lawn Bulk Sale — Ahmed Textiles',
            amount: 32550,
            paymentMethod: 'cash',
            notes: 'INV-001 — Cotton & Printed Lawn'
        },
        {
            type: 'sale',
            description: 'Silk Export — Somchai Trading',
            amount: 57750,
            paymentMethod: 'bank_transfer',
            notes: 'INV-002 — Silk & Organza export'
        },
        {
            type: 'purchase',
            description: 'Lawn stock from Faisalabad Mills',
            amount: -120000,
            paymentMethod: 'bank_transfer',
            notes: 'Season stock — 400m cotton lawn'
        },
        {
            type: 'purchase',
            description: 'Silk import from Thailand',
            amount: -85000,
            paymentMethod: 'bank_transfer',
            notes: 'Raw silk and organza — 80 meters'
        },
        {
            type: 'expense',
            description: 'Factory Utility Bill',
            amount: -18000,
            paymentMethod: 'cash',
            notes: 'Monthly electricity — SITE factory'
        }
    ],

    /**
     * Test user data
     */
    users: () => ({
        owner: {
            uid: 'owner-uid-1',
            email: 'owner@stgfabric.test',
            role: 'owner',
            name: 'Factory Owner',
            assignedBranches: ['branch-khi', 'branch-thai']
        },
        manager: {
            uid: 'manager-uid-1',
            email: 'manager@stgfabric.test',
            role: 'manager',
            name: 'Karachi Manager',
            assignedBranches: ['branch-khi']
        },
        cashier: {
            uid: 'cashier-uid-1',
            email: 'cashier@stgfabric.test',
            role: 'cashier',
            name: 'Sales Counter Staff',
            assignedBranches: ['branch-khi']
        }
    }),

    /**
     * Stock transfer between branches
     */
    stockTransfer: (fromBranch = 'branch-khi', toBranch = 'branch-thai') => ({
        fromBranchId: fromBranch,
        toBranchId: toBranch,
        items: [
            {
                productId: 'p4',
                productName: 'Raw Silk - Ivory',
                quantity: 50,
                reason: 'Thailand export order fulfillment'
            }
        ],
        initiatedBy: 'owner-uid-1',
        status: 'pending',
        notes: 'Export consignment — STG Thailand branch'
    })
}

/**
 * Populate Firestore with fabric test data
 * Called from: Backup.jsx → "Seed Test Data" button
 *
 * Usage: populateTestData(businessId, userId, firestoreService, logger)
 */
export const populateTestData = async (businessId, userId, firestoreService, logger = null) => {
    const log = (type, msg) => {
        console.log(`${type.toUpperCase()}: ${msg}`)
        if (logger) logger(type, msg)
    }

    try {
        log('info', 'Starting fabric demo data seeding...')

        // 1. Add categories
        log('info', 'Adding fabric categories...')
        const categories = generateSeedData.categories()
        let categoryIds = {}
        for (const cat of categories) {
            const docRef = await firestoreService.addCategory(businessId, cat)
            categoryIds[cat.name] = docRef.id
        }

        // 2. Add 10 fabric products
        log('info', 'Adding 10 fabric products...')
        const products = generateSeedData.products()
        let productIds = []
        const catKeyMap = {
            'cat-lawn':      'Lawn',
            'cat-cotton':    'Cotton',
            'cat-silk':      'Silk',
            'cat-denim':     'Denim',
            'cat-synthetic': 'Synthetic',
            'cat-linen':     'Linen'
        }
        for (const product of products) {
            const catName = catKeyMap[product.category_id] || 'Cotton'
            const docRef = await firestoreService.addProduct(businessId, {
                ...product,
                category_id: categoryIds[catName] || Object.values(categoryIds)[0]
            })
            productIds.push(docRef.id)
        }

        // 3. Add suppliers
        log('info', 'Adding fabric suppliers...')
        const suppliers = generateSeedData.suppliers()
        for (const supplier of suppliers) {
            await firestoreService.addSupplier(businessId, supplier)
        }

        // 4. Add customers
        log('info', 'Adding customers (Pakistan + Thailand)...')
        const customers = generateSeedData.customers()
        let customerIds = []
        for (const customer of customers) {
            const docRef = await firestoreService.addCustomer(businessId, customer)
            customerIds.push(docRef.id)
        }

        // 5. Per-branch: inventory, sales, cash flow
        log('info', 'Getting branches...')
        const branchesSnap = await firestoreService.getBranches(businessId)

        for (const branchDoc of branchesSnap.docs) {
            const branchId = branchDoc.id
            log('info', `Populating branch: ${branchId}`)

            // Inventory
            log('info', 'Adding inventory (meters)...')
            const inventory = generateSeedData.inventory(productIds)
            await firestoreService.batchAddInventoryItems(businessId, branchId, inventory)

            // Sales
            log('info', 'Adding 5 fabric sale records...')
            const sales = generateSeedData.sales(customerIds[0])
            for (const sale of sales) {
                await firestoreService.addSale(businessId, branchId, {
                    ...sale,
                    createdAt: new Date()
                })
            }

            // Cash flow
            log('info', 'Adding cash flow entries...')
            const cashFlows = generateSeedData.cashFlow()
            for (const cf of cashFlows) {
                await firestoreService.addCashFlow(businessId, branchId, {
                    ...cf,
                    createdAt: new Date()
                })
            }
        }

        // 6. Sample staff profiles
        log('info', 'Adding sample staff profiles...')
        const sampleUsers = generateSeedData.users()
        const branches = await firestoreService.getBranches(businessId)
        const firstBranchId = branches.docs[0]?.id

        const staffToSeed = [sampleUsers.manager, sampleUsers.cashier]
        for (const staff of staffToSeed) {
            const staffUid = `staff_${staff.role}_${Date.now()}`

            await setDoc(doc(db, 'business_users', businessId, staffUid, 'profile'), {
                ...staff,
                uid: staffUid,
                businessId,
                assignedBranches: [firstBranchId],
                status: 'active',
                createdAt: serverTimestamp()
            })

            await setDoc(doc(db, 'users', staffUid), {
                uid: staffUid,
                businessId,
                role: staff.role,
                name: staff.name,
                email: staff.email,
                updatedAt: serverTimestamp()
            })
        }

        log('done', 'Fabric demo data seeded successfully!')
        return {
            success: true,
            summary: {
                categories: Object.keys(categoryIds).length,
                products: productIds.length,
                customers: customerIds.length,
                suppliers: suppliers.length,
                sales: 5,
                cashFlowEntries: 5
            }
        }
    } catch (error) {
        log('error', `Error seeding data: ${error.message}`)
        return { success: false, error: error.message }
    }
}

export default generateSeedData
