import mongoose from 'mongoose';
import config from '../config';
import Product from '../models/Product';

async function run() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected');

  const samples = [
    { name: 'Chó Poodle', price: 4500000, image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Chó', description: 'Poodle thân thiện, thông minh.' },
    { name: 'Chó Corgi', price: 7000000, image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Chó', description: 'Corgi chân ngắn đáng yêu.' },
    { name: 'Chó Husky', price: 9000000, image: 'https://images.unsplash.com/photo-1543466835-9cbd5f2b24d0?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Chó', description: 'Husky năng động.' },
    { name: 'Mèo Anh Lông Ngắn', price: 3500000, image: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c86?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Mèo', description: 'ALN hiền lành.' },
    { name: 'Mèo Ba Tư', price: 5000000, image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Mèo', description: 'Ba Tư lông dài sang trọng.' },
    { name: 'Mèo Munchkin', price: 4000000, image: 'https://images.unsplash.com/photo-1592924357228-91e3c31b43a2?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Mèo', description: 'Munchkin chân ngắn.' },
    { name: 'Dây dắt thú cưng', price: 150000, image: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Phụ kiện', description: 'Dây dắt bền đẹp.' },
    { name: 'Ổ nằm thú cưng', price: 320000, image: 'https://images.unsplash.com/photo-1601758064132-1f4eb7f3cd9f?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Phụ kiện', description: 'Ổ nằm êm ái.' },
    { name: 'Đồ chơi gặm', price: 120000, image: 'https://images.unsplash.com/photo-1601758003122-58f03f67b4d6?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Phụ kiện', description: 'Đồ chơi an toàn.' },
    { name: 'Sữa tắm thú cưng', price: 180000, image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=60&fm=webp', category: 'Phụ kiện', description: 'Sữa tắm dịu nhẹ.' },
  ];

  for (const s of samples) {
    const exists = await Product.findOne({ name: s.name });
    if (!exists) {
      await Product.create(s as any);
      console.log('Created product:', s.name);
    } else {
      console.log('Exists product:', s.name);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((e) => { console.error(e); process.exit(1); });
