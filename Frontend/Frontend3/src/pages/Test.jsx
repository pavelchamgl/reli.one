
export const groupBySeller = (items) => {
  const map = new Map();

  for (const item of items) {
    if (!map.has(item.seller_id)) {
      map.set(item.seller_id, []);
    }
    map.get(item.seller_id).push(item);
  }

  return Array.from(map, ([seller_id, items]) => ({ seller_id, items }));
};

const Test = () => {
  const items = [

    {

      id: 1,

      product: {

        id: 1,

        name: 'Wooden Puzzle Unidragon – Thomas Rabbit vel. (32×23cm)',

        product_description:

          'If you are looking for an interesting way to train your brain and challenge yourself, there is no\r\n' +

          'better option than assembling an extraordinary puzzle.\r\n' +

          'This classic pastime is excellent for improving short-term memory, problem-solving skills, and\r\n' +

          'attention to detail.\r\n' +

          'Moreover, puzzles can help relax the mind after a long and demanding workday.\r\n' +

          'Let your thoughts wander through peaceful meadows and lush green forests with this puzzle set.\r\n' +

          'Each piece of our wooden puzzle has a precise and fantastic shape, from various types of magical\r\n' +

          'wands to stars and mystical creatures.\r\n' +

          'Once completed, it becomes a stunning work of art that can decorate your living room.\r\n' +

          'These intricate pieces are laser-cut, ensuring smooth edges that fit perfectly together without any\r\n' +

          'burnt marks from the laser.\r\n' +

          'The beautiful images and vibrant colors will not fade even after multiple touches, guaranteeing that\r\n' +

          'your puzzle set will look flawless for a long time.\r\n' +

          'Enjoy the experience of assembling a wooden puzzle from Unidragon!',

        category_name: 'Puzzles and brain teasers',

        product_parameters: [

          { id: 1, name: 'Width', value: '320' },

          { id: 2, name: 'Height', value: '230' },

          { id: 8, name: 'Number of Pieces', value: '250 pcs' },

          { id: 9, name: 'Weight', value: '990' },

          { id: 14, name: 'Material', value: 'Wood' }

        ],

        rating: '0.0',

        total_reviews: 0,

        license_file: null,

        images: [

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-rabbit-series-thoma_jXpAoO0.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-rabbit-series-thoma_KcX9V3Z.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-rabbit-series-thoma_vKhCKdR.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-rabbit-series-thoma_aBVCv9v.webp'

          }

        ],

        is_favorite: false,

        variants: [

          {

            id: 1,

            sku: '283635795',

            name: 'Size',

            text: 'One',

            image: null,

            price: '49.90',

            price_without_vat: 49.9

          }

        ],

        can_review: [],

        seller_id: 7,

        is_age_restricted: false,

        price: '49.90'

      },

      count: 1,

      selected: true,

      sku: '283635795',

      seller_id: 7

    },

    {

      id: 3,

      product: {

        id: 3,

        name: 'Wooden Puzzle Unidragon – Gently Lynx',

        product_description:

          'If you are looking for an interesting way to train your brain and challenge yourself, there is no\r\n' +

          'better option than assembling an extraordinary puzzle.\r\n' +

          'This classic pastime is excellent for improving short-term memory, problem-solving skills, and\r\n' +

          'attention to detail.\r\n' +

          'Moreover, puzzles can help relax the mind after a long and demanding workday.\r\n' +

          'Let your thoughts wander through peaceful meadows and lush green forests with this puzzle set.\r\n' +

          'Each piece of our wooden puzzle has a precise and fantastic shape, from various types of magical\r\n' +

          'wands to stars and mystical creatures.\r\n' +

          'Once completed, it becomes a stunning work of art that can decorate your living room.\r\n' +

          'These intricate pieces are laser-cut, ensuring smooth edges that fit perfectly together without any\r\n' +

          'burnt marks from the laser.\r\n' +

          'The beautiful images and vibrant colors will not fade even after multiple touches, guaranteeing that\r\n' +

          'your puzzle set will look flawless for a long time.\r\n' +

          'Enjoy the experience of assembling a wooden puzzle from Unidragon!',

        category_name: 'Puzzles and brain teasers',

        product_parameters: [

          {

            id: 3,

            name: 'Width',

            value: 'S-170 mm/\r\nM-220 mm/\r\nKS-270'

          },

          {

            id: 4,

            name: 'Height',

            value: 'S-250 mm/\r\nM-330 mm/\r\nKS-410'

          },

          { id: 5, name: 'Weight', value: 'S-270 g/\r\nM-470 g/\r\nKS-650' },

          {

            id: 6,

            name: 'Number of Pieces',

            value: 'S-105 pcs/\r\nM-187 pcs/\r\nKS-297 pcs'

          },

          { id: 7, name: 'Material', value: 'Wood' }

        ],

        rating: '0.0',

        total_reviews: 0,

        license_file: null,

        images: Array(7)[

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-1_LWr3ISI.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-2_F3e6qXT.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-3_g1NsWEl.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-5_WJx0znB.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-8_ekCX432.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-10_zgnucxy.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-16_2bbT812.webp'

          }

        ],

        is_favorite: false,

        variants: [

          {

            id: 4,

            sku: '206604747',

            name: 'Size',

            text: '17×25cm',

            image: null,

            price: '29.90',

            price_without_vat: 29.9

          },

          {

            id: 6,

            sku: '258779867',

            name: 'Size',

            text: '22×33cm',

            image: null,

            price: '49.90',

            price_without_vat: 49.9

          },

          {

            id: 7,

            sku: '142231200',

            name: 'Size',

            text: '27×41cm',

            image: null,

            price: '69.90',

            price_without_vat: 69.9

          }

        ],

        can_review: [],

        seller_id: 7,

        is_age_restricted: false,

        price: '29.90'

      },

      count: 1,

      selected: true,

      sku: '206604747',

      seller_id: 7

    },

    {

      id: 3,

      product: {

        id: 3,

        name: 'Wooden Puzzle Unidragon – Gently Lynx',

        product_description:

          'If you are looking for an interesting way to train your brain and challenge yourself, there is no\r\n' +

          'better option than assembling an extraordinary puzzle.\r\n' +

          'This classic pastime is excellent for improving short-term memory, problem-solving skills, and\r\n' +

          'attention to detail.\r\n' +

          'Moreover, puzzles can help relax the mind after a long and demanding workday.\r\n' +

          'Let your thoughts wander through peaceful meadows and lush green forests with this puzzle set.\r\n' +

          'Each piece of our wooden puzzle has a precise and fantastic shape, from various types of magical\r\n' +

          'wands to stars and mystical creatures.\r\n' +

          'Once completed, it becomes a stunning work of art that can decorate your living room.\r\n' +

          'These intricate pieces are laser-cut, ensuring smooth edges that fit perfectly together without any\r\n' +

          'burnt marks from the laser.\r\n' +

          'The beautiful images and vibrant colors will not fade even after multiple touches, guaranteeing that\r\n' +

          'your puzzle set will look flawless for a long time.\r\n' +

          'Enjoy the experience of assembling a wooden puzzle from Unidragon!',

        category_name: 'Puzzles and brain teasers',

        product_parameters: [

          {

            id: 3,

            name: 'Width',

            value: 'S-170 mm/\r\nM-220 mm/\r\nKS-270'

          },

          {

            id: 4,

            name: 'Height',

            value: 'S-250 mm/\r\nM-330 mm/\r\nKS-410'

          },

          { id: 5, name: 'Weight', value: 'S-270 g/\r\nM-470 g/\r\nKS-650' },

          {

            id: 6,

            name: 'Number of Pieces',

            value: 'S-105 pcs/\r\nM-187 pcs/\r\nKS-297 pcs'

          },

          { id: 7, name: 'Material', value: 'Wood' }

        ],

        rating: '0.0',

        total_reviews: 0,

        license_file: null,

        images: Array(7)[

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-1_LWr3ISI.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-2_F3e6qXT.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-3_g1NsWEl.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-5_WJx0znB.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-8_ekCX432.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-10_zgnucxy.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-16_2bbT812.webp'

          }

        ],

        is_favorite: false,

        variants: [

          {

            id: 4,

            sku: '206604747',

            name: 'Size',

            text: '17×25cm',

            image: null,

            price: '29.90',

            price_without_vat: 29.9

          },

          {

            id: 6,

            sku: '258779867',

            name: 'Size',

            text: '22×33cm',

            image: null,

            price: '49.90',

            price_without_vat: 49.9

          },

          {

            id: 7,

            sku: '142231200',

            name: 'Size',

            text: '27×41cm',

            image: null,

            price: '69.90',

            price_without_vat: 69.9

          }

        ],

        can_review: [],

        seller_id: 7,

        is_age_restricted: false,

        price: '49.90'

      },

      count: 1,

      selected: true,

      sku: '258779867',

      seller_id: 7

    },

    {

      id: 3,

      product: {

        id: 3,

        name: 'Wooden Puzzle Unidragon – Gently Lynx',

        product_description:

          'If you are looking for an interesting way to train your brain and challenge yourself, there is no\r\n' +

          'better option than assembling an extraordinary puzzle.\r\n' +

          'This classic pastime is excellent for improving short-term memory, problem-solving skills, and\r\n' +

          'attention to detail.\r\n' +

          'Moreover, puzzles can help relax the mind after a long and demanding workday.\r\n' +

          'Let your thoughts wander through peaceful meadows and lush green forests with this puzzle set.\r\n' +

          'Each piece of our wooden puzzle has a precise and fantastic shape, from various types of magical\r\n' +

          'wands to stars and mystical creatures.\r\n' +

          'Once completed, it becomes a stunning work of art that can decorate your living room.\r\n' +

          'These intricate pieces are laser-cut, ensuring smooth edges that fit perfectly together without any\r\n' +

          'burnt marks from the laser.\r\n' +

          'The beautiful images and vibrant colors will not fade even after multiple touches, guaranteeing that\r\n' +

          'your puzzle set will look flawless for a long time.\r\n' +

          'Enjoy the experience of assembling a wooden puzzle from Unidragon!',

        category_name: 'Puzzles and brain teasers',

        product_parameters: [

          {

            id: 3,

            name: 'Width',

            value: 'S-170 mm/\r\nM-220 mm/\r\nKS-270'

          },

          {

            id: 4,

            name: 'Height',

            value: 'S-250 mm/\r\nM-330 mm/\r\nKS-410'

          },

          { id: 5, name: 'Weight', value: 'S-270 g/\r\nM-470 g/\r\nKS-650' },

          {

            id: 6,

            name: 'Number of Pieces',

            value: 'S-105 pcs/\r\nM-187 pcs/\r\nKS-297 pcs'

          },

          { id: 7, name: 'Material', value: 'Wood' }

        ],

        rating: '0.0',

        total_reviews: 0,

        license_file: null,

        images: Array(7)[

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-1_LWr3ISI.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-2_F3e6qXT.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-3_g1NsWEl.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-5_WJx0znB.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-8_ekCX432.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-10_zgnucxy.webp'

          },

          {

            image_url:

              'http://reli.one/media/base_product_images/unidragon-wooden-puzzle-jigsaw-puzzle-for-adult-gentle-lynx-m-16_2bbT812.webp'

          }

        ],

        is_favorite: false,

        variants: [

          {

            id: 4,

            sku: '206604747',

            name: 'Size',

            text: '17×25cm',

            image: null,

            price: '29.90',

            price_without_vat: 29.9

          },

          {

            id: 6,

            sku: '258779867',

            name: 'Size',

            text: '22×33cm',

            image: null,

            price: '49.90',

            price_without_vat: 49.9

          },

          {

            id: 7,

            sku: '142231200',

            name: 'Size',

            text: '27×41cm',

            image: null,

            price: '69.90',

            price_without_vat: 69.9

          }

        ],

        can_review: [],

        seller_id: 7,

        is_age_restricted: false,

        price: '69.90'

      },

      count: 1,

      selected: true,

      sku: '142231200',

      seller_id: 7

    }

  ]



  const grouped = groupBySeller(items);
  console.log(grouped);

  return (
    <div>Test</div>
  )
}

export default Test