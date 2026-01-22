// {

//     data: {

//         summary: {

//             id: 29,

//                 order_number: '180126115015-b625df',

//                     order_date: '18.01.2026 11:50',

//                         status: 'Pending',

//                             customer: {

//                 first_name: 'Dastan',

//                     last_name: 'Almazbekov',

//                         email: 'dastanalmazbekuulu9@gmail.com',

//                             phone: '+421 848 484 848'

//             },

//             delivery: {

//                 delivery_type: { id: 2, name: 'Home Delivery' },

//                 courier_service: { id: 2, name: 'Zásilkovna', code: 'zasilkovna' },

//                 pickup_point_id: null,

//                     delivery_address: {

//                     full_name: 'Dastan Almazbekov',

//                         email: 'dastanalmazbekuulu9@gmail.com',

//                             phone: '+421 848 484 848',

//                                 street: 'Jabloňová',

//                                     city: 'Brno',

//                                         zip_code: '81101',

//                                             country: 'SK'

//                 }

//             },

//             branch: { id: 1, name: 'Reli warehouse' },

//             totals: {

//                 purchase_excl_vat: '9.45',

//                     sales_incl_vat: '10.40',

//                         total_incl_vat_plus_delivery: '15.63',

//                             delivery_cost: '5.23',

//                                 currency: 'EUR'

//             }

//         },

//         items: [

//             {

//                 id: 34,

//                 sku: '127129926',

//                 name: 'test',

//                 variant_name: 'green text',

//                 quantity: 1,

//                 unit_price_gross: '10.40',

//                 vat_rate: '10.00',

//                 line_total_gross: '10.40',

//                 line_total_net: '9.45',

//                 warehouse: { id: 1, name: 'Reli warehouse' }

//             }

//         ],

//             shipments: [

//                 {

//                     id: 29,

//                     carrier: { id: 2, name: 'Zásilkovna' },

//                     tracking_number: '4599308548',

//                     has_tracking: true,

//                     hassum_label: true,

//                     label_url: 'http://reli.one/media/zasilkovna_labels/label_4599308548.pdf',

//                     created_at: '18.01.2026 11:50',

//                     warehouse: { id: 1, name: 'Reli warehouse' },

//                     items: [

//                         {

//                             order_product_id: 34,

//                             sku: '127129926',

//                             name: 'test green text',

//                             quantity: 1

//                         }

//                     ]

//                 }

//             ],

//                 timeline: [

//                     {

//                         type: 'order_created',

//                         label: 'Order created',

//                         created_at: '18.01.2026 11:50',

//                         meta: {}

//                     },

//                     {

//                         type: 'payment_confirmed',

//                         label: 'Payment confirmed',

//                         created_at: '18.01.2026 11:50',

//                         meta: {

//                             payment_id: 20,

//                             stripe_session_id:

//                                 'cs_test_b1TotOy0wwmHbORg0ph4kRJaiG59Tiy3kvKlKbAIAkz4qjWMD7EHxYKlP1'

//                         }

//                     }

//                 ],

//                     actions: {

//             can_confirm: true,

//                 can_mark_shipped: false,

//                     can_download_label: true,

//                         can_cancel: false,

//                             next_action: 'Confirm order'

//         }

//     },